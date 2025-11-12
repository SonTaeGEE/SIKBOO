import { useEffect, useState } from 'react';
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

  // ---------- 탭 초기화 규칙 ----------
  // 1) 다른 탭에서 /recipes 로 "처음" 진입하면 CREATE
  // 2) 상세 -> 브라우저 뒤로가기(popstate) 시에는 기존 state 유지
  // 구현: mount 시에만 CREATE로 강제, 이후엔 건드리지 않음
  const [tab, setTab] = useState(Tab.CREATE);

  useEffect(() => {
    // mount 직후 한 번만 생성 탭으로 강제
    setTab(Tab.CREATE);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [selected, setSelected] = useState(() => new Set());

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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qKeys.sessions });
      setSelected(new Set());
      setTab(Tab.LIST); // 생성 완료 후 목록으로
    },
  });

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
            onClick={() => setTab(Tab.CREATE)}
            className={cx(
              'rounded-lg py-2',
              tab === Tab.CREATE ? 'bg-white font-semibold shadow' : 'text-slate-500',
            )}
          >
            생성
          </button>
          <button
            onClick={() => setTab(Tab.LIST)}
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
                    onClick={() => navigate(`/recipes/sessions/${room.id}`)}
                    className="w-full rounded-xl border bg-white px-4 py-3 text-left transition hover:bg-indigo-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">{room.title}</div>
                      <div className="text-xs text-slate-500">
                        {new Date(room.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* 생성 진행 중 오버레이 (컴포넌트 연동) */}
      <RecipeGeneratingOverlay
        visible={gen.isPending}
        message="레시피 생성중"
        blockPointer={true}
      />

      {/* 하단 슬라이드 업 바는 선택이 있을 때만 렌더(네브바 간섭 방지) */}
      {selCount > 0 && (
        <div className="fixed inset-x-0 bottom-[calc(64px+32px)] z-[999] transform-gpu transition-all duration-300 ease-in-out">
          <div className="mx-auto max-w-full px-4 md:max-w-screen-md md:px-6 lg:max-w-4xl lg:px-8">
            <button
              onClick={() => gen.mutate()}
              disabled={gen.isPending || selCount === 0}
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
