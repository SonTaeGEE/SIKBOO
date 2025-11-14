import React, { useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import SectionTitle from '@/components/Recipe/SectionTitle';
import Skeleton from '@/components/Recipe/Skeleton';
import Empty from '@/components/Recipe/Empty';
import ErrorBox from '@/components/Recipe/ErrorBox';
import IngredientRow from '@/components/Recipe/IngredientRow';
import recipeApi from '@/api/recipeApi';

const Tab = { CREATE: 'CREATE', LIST: 'LIST' };
const cx = (...xs) => xs.filter(Boolean).join(' ');

const qKeys = {
  myIngredients: ['ingredients', 'mine'],
  sessions: ['recipes', 'sessions'],
  sessionDetail: (id) => ['recipes', 'session', id],
};

// 55초를 10등분(각 단계 약 5.5초)
const STEP_INTERVAL_MS = 5_500;

export default function Recipes() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  // ▼ 최초 진입 시 기본 탭: sessionStorage → 기본값 CREATE
  const initialTab = useMemo(
    () => (sessionStorage.getItem('recipes.defaultTab') === Tab.LIST ? Tab.LIST : Tab.CREATE),
    [],
  );
  const [tab, setTab] = useState(initialTab);

  const [selected, setSelected] = useState(() => new Set());

  // ★ sessionStorage 에 남아 있던 대기중 세션 복원
  const [waitingSessionId, setWaitingSessionId] = useState(() => {
    const storedId = sessionStorage.getItem('recipes.waitingSessionId');
    return storedId ? Number(storedId) : null;
  });

  // ★ 진행중 여부 복원
  const [isGeneratingPersist, setIsGeneratingPersist] = useState(() => {
    return sessionStorage.getItem('recipes.isGenerating') === 'true';
  });

  // ★ 진행 단계 복원 (시간 경과 기준 재계산)
  const [progressStep, setProgressStep] = useState(() => {
    const startedAtStr = sessionStorage.getItem('recipes.progressStartedAt');
    if (!startedAtStr) return 0;
    const startedAt = Number(startedAtStr);
    if (!Number.isFinite(startedAt)) return 0;

    const elapsed = Date.now() - startedAt;
    const step = Math.min(10, Math.max(1, Math.floor(elapsed / STEP_INTERVAL_MS) + 1));
    // step 값을 storage에도 다시 써둠(복원 시 정합성)
    sessionStorage.setItem('recipes.progressStep', String(step));
    return step;
  });

  // percent는 항상 step에서 계산 (불일치 방지)
  const progressPercent = Math.min(progressStep * 10, 100);

  // 내 재료
  const my = useQuery({
    queryKey: qKeys.myIngredients,
    queryFn: recipeApi.fetchMyIngredients,
    enabled: tab === Tab.CREATE,
  });

  const toggle = (id) =>
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  // 레시피 생성(세션 생성)
  const gen = useMutation({
    mutationFn: () => recipeApi.generateRecipes(Array.from(selected)),
    onMutate: () => {
      // 진행률 관련 상태 및 저장값 초기화
      setProgressStep(0);
      setIsGeneratingPersist(false);
      sessionStorage.removeItem('recipes.progressStartedAt');
      sessionStorage.removeItem('recipes.progressStep');
      sessionStorage.removeItem('recipes.waitingSessionId');
      sessionStorage.removeItem('recipes.isGenerating');
    },
    onSuccess: (created) => {
      // 선택 초기화
      setSelected(new Set());

      const newId = created?.id ?? null;
      if (newId) {
        const now = Date.now();

        setWaitingSessionId(newId);
        setIsGeneratingPersist(true);

        sessionStorage.setItem('recipes.waitingSessionId', String(newId));
        sessionStorage.setItem('recipes.progressStartedAt', String(now));
        sessionStorage.setItem('recipes.progressStep', '1');
        sessionStorage.setItem('recipes.isGenerating', 'true');

        setProgressStep(1);
      }

      // 생성 탭 → 바로 목록 탭으로 이동
      sessionStorage.setItem('recipes.defaultTab', Tab.LIST);
      setTab(Tab.LIST);

      // 새 방이 바로 목록에 보이도록 세션 목록 리패치
      qc.invalidateQueries({ queryKey: qKeys.sessions });
    },
  });

  // 생성/대기 중인지 전역 플래그
  const generatingVisible = gen.isPending || isGeneratingPersist || !!waitingSessionId;

  // ★ 생성 완료 대기: waitingSessionId가 있으면 상세를 폴링
  const waitDetail = useQuery({
    queryKey: waitingSessionId ? qKeys.sessionDetail(waitingSessionId) : ['noop'],
    queryFn: () => recipeApi.getSessionDetail(waitingSessionId),
    enabled: !!waitingSessionId,
    refetchInterval: 1200, // 1.2s 폴링
    refetchOnWindowFocus: true,
  });

  // ★ 상세 데이터가 준비되었는지 판별 (have/need 중 하나라도 채워지면 완료로 간주)
  useEffect(() => {
    if (!waitingSessionId) return;
    if (waitDetail.isSuccess) {
      const d = waitDetail.data || {};
      const ready =
        (Array.isArray(d.have) && d.have.length > 0) ||
        (Array.isArray(d.need) && d.need.length > 0);

      if (ready) {
        // 완료 시에는 10/10 로 세팅
        setProgressStep(10);
        sessionStorage.setItem('recipes.progressStep', '10');

        // 목록 새로고침
        qc.invalidateQueries({ queryKey: qKeys.sessions });
        sessionStorage.setItem('recipes.defaultTab', Tab.LIST);
        setTab(Tab.LIST);

        // 진행 상태 종료
        setWaitingSessionId(null);
        setIsGeneratingPersist(false);
        sessionStorage.removeItem('recipes.waitingSessionId');
        sessionStorage.removeItem('recipes.progressStartedAt');
        sessionStorage.removeItem('recipes.progressStep');
        sessionStorage.removeItem('recipes.isGenerating');
      }
    }
  }, [waitingSessionId, waitDetail.isSuccess, waitDetail.data, qc]);

  // ★ progress 애니메이션: generatingVisible 동안 55초에 걸쳐 step 0→10
  useEffect(() => {
    if (!generatingVisible) {
      setProgressStep(0);
      return;
    }

    const id = setInterval(() => {
      setProgressStep((prev) => {
        if (prev >= 10) return prev;
        const next = prev === 0 ? 1 : prev + 1;
        sessionStorage.setItem('recipes.progressStep', String(next));
        return next;
      });
    }, STEP_INTERVAL_MS);

    return () => clearInterval(id);
  }, [generatingVisible]);

  // 세션 목록
  const sessions = useQuery({
    queryKey: qKeys.sessions,
    queryFn: recipeApi.listSessions,
    enabled: tab === Tab.LIST,
  });

  const selCount = selected.size;

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-full bg-[#F8F3FF] pb-[88px] md:max-w-screen-md lg:max-w-4xl">
      {/* 헤더 + 탭 */}
      <div className="sticky top-0 z-10 bg-[#F8F3FF]/90 px-4 pt-3 pb-2 backdrop-blur md:px-6 lg:px-8">
        <h1 className="text-center text-lg font-bold">레시피</h1>
        <div className="mt-3 grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-sm">
          <button
            onClick={() => {
              sessionStorage.setItem('recipes.defaultTab', Tab.CREATE);
              setTab(Tab.CREATE);
            }}
            className={cx(
              'rounded-lg py-2',
              tab === Tab.CREATE ? 'bg-white font-semibold shadow' : 'text-slate-500',
            )}
          >
            생성
          </button>
          <button
            onClick={() => {
              sessionStorage.setItem('recipes.defaultTab', Tab.LIST);
              setTab(Tab.LIST);
            }}
            className={cx(
              'rounded-lg py-2',
              tab === Tab.LIST ? 'bg-white font-semibold shadow' : 'text-slate-500',
            )}
          >
            목록
          </button>
        </div>
      </div>

      {/* 본문 */}
      <div className="px-4 pt-3 md:px-6 lg:px-8">
        {tab === Tab.CREATE ? (
          <>
            {my.isLoading && <div className="py-10 text-center text-slate-500">불러오는 중…</div>}
            {my.isError && <ErrorBox error={my.error} />}
            {!my.isLoading &&
              !my.isError &&
              (my.data.length === 0 ? (
                <Empty text="등록된 내 재료가 없어요." />
              ) : (
                <ul className="divide-y">
                  {my.data.map((it) => (
                    <IngredientRow
                      key={it.id}
                      it={it}
                      selected={selected.has(it.id)}
                      onToggle={toggle}
                    />
                  ))}
                </ul>
              ))}
          </>
        ) : (
          <>
            <SectionTitle>내가 만든 레시피 방</SectionTitle>
            {sessions.isLoading ? (
              <Skeleton />
            ) : sessions.isError ? (
              <ErrorBox error={sessions.error} />
            ) : sessions.data.length === 0 ? (
              <Empty text="아직 생성된 방이 없어요. 생성 탭에서 만들어보세요!" />
            ) : (
              <div className="mb-10 space-y-2">
                {sessions.data.map((room) => {
                  const isCurrentGeneratingRoom =
                    waitingSessionId != null && room.id === waitingSessionId && generatingVisible;

                  const createdAtText = room.createdAt
                    ? new Date(room.createdAt).toLocaleString()
                    : '';

                  return (
                    <button
                      key={room.id}
                      type="button"
                      disabled={isCurrentGeneratingRoom}
                      onClick={() => {
                        if (isCurrentGeneratingRoom) return; // 생성중이면 진입 막기
                        sessionStorage.setItem('recipes.defaultTab', Tab.LIST);
                        navigate(`/recipes/sessions/${room.id}`);
                      }}
                      className={cx(
                        'w-full rounded-xl border px-4 py-3 text-left transition',
                        isCurrentGeneratingRoom
                          ? 'cursor-not-allowed bg-gradient-to-r from-emerald-100 via-emerald-50 to-emerald-100 opacity-95'
                          : 'bg-white hover:bg-indigo-50',
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {/* 생성중일 때는 항상 이 텍스트로 & 깜빡이게 */}
                          <span
                            className={cx(
                              'font-semibold',
                              isCurrentGeneratingRoom && 'animate-pulse text-black',
                            )}
                          >
                            {isCurrentGeneratingRoom ? '레시피 생성중…' : room.title}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">{createdAtText}</div>
                      </div>

                      {/* 이 방이 현재 생성중일 때만 진행률 바 노출 */}
                      {isCurrentGeneratingRoom && (
                        <div className="mt-2">
                          <div className="mb-1 flex items-center justify-between text-[11px] text-slate-600">
                            <span>
                              진행률 {progressStep}/10 ({progressPercent}%)
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-emerald-100">
                            <div
                              className="h-full rounded-full bg-emerald-400 transition-all duration-500 ease-out"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* 하단 슬라이드 업 바는 선택이 있을 때만 렌더(네브바 간섭 방지) */}
      {selCount > 0 && (
        <div className="fixed inset-x-0 bottom-[calc(64px+32px)] z-[999] transform-gpu transition-all duration-300 ease-in-out">
          <div className="mx-auto max-w-full px-4 md:max-w-screen-md md:px-6 lg:max-w-4xl lg:px-8">
            <button
              onClick={() => gen.mutate()}
              disabled={gen.isPending || generatingVisible || selCount === 0}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-white shadow-lg disabled:opacity-60"
            >
              레시피 생성
              {selCount > 0 && (
                <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs">
                  {selCount}
                </span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
