import React, { useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import SectionTitle from '@/components/Recipe/SectionTitle';
import Skeleton from '@/components/Recipe/Skeleton';
import Empty from '@/components/Recipe/Empty';
import ErrorBox from '@/components/Recipe/ErrorBox';
import IngredientRow from '@/components/Recipe/IngredientRow';
import RecipeGeneratingOverlay from '@/components/ui/RecipeGeneratingOverlay';
import recipeApi from '@/api/recipeApi';

const Tab = { CREATE: 'CREATE', LIST: 'LIST' };
const cx = (...xs) => xs.filter(Boolean).join(' ');

const qKeys = {
  myIngredients: ['ingredients', 'mine'],
  sessions: ['recipes', 'sessions'],
  sessionDetail: (id) => ['recipes', 'session', id],
};

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

  // ★ 생성 완료 대기용: 방 ID가 저장되면 상세를 폴링해 준비 완료를 감지
  const [waitingSessionId, setWaitingSessionId] = useState(null);

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
    onSuccess: (created) => {
      // 선택 초기화
      setSelected(new Set());
      // 목록은 아직 가지 않음 —> 생성 완료될 때 이동
      setWaitingSessionId(created?.id ?? null);
    },
  });

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
        // 목록 새로고침
        qc.invalidateQueries({ queryKey: qKeys.sessions });
        // 다음에 /recipes 들어오면 LIST가 초기 탭이 되도록 저장
        sessionStorage.setItem('recipes.defaultTab', Tab.LIST);
        setTab(Tab.LIST);
        setWaitingSessionId(null);
      }
    }
  }, [waitingSessionId, waitDetail.isSuccess, waitDetail.data, qc]);

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
                {sessions.data.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => {
                      // 상세로 들어갔다가 뒤로가기 시 목록 탭으로 돌아오도록 설정
                      sessionStorage.setItem('recipes.defaultTab', Tab.LIST);
                      navigate(`/recipes/sessions/${room.id}`);
                    }}
                    className="w-full rounded-xl border bg-white px-4 py-3 text-left transition hover:bg-indigo-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">{room.title}</div>
                      <div className="text-xs text-slate-500">
                        {room.createdAt ? new Date(room.createdAt).toLocaleString() : ''}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* 생성 진행 중 오버레이: '처음 생성' + 생성 완료 대기 동안 표시 */}
      <RecipeGeneratingOverlay
        visible={gen.isPending || !!waitingSessionId}
        message="레시피 생성중"
        blockPointer={true}
      />

      {/* 하단 슬라이드 업 바는 선택이 있을 때만 렌더(네브바 간섭 방지) */}
      {selCount > 0 && (
        <div className="fixed inset-x-0 bottom-[calc(64px+32px)] z-[999] transform-gpu transition-all duration-300 ease-in-out">
          <div className="mx-auto max-w-full px-4 md:max-w-screen-md md:px-6 lg:max-w-4xl lg:px-8">
            <button
              onClick={() => gen.mutate()}
              disabled={gen.isPending || !!waitingSessionId || selCount === 0}
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
