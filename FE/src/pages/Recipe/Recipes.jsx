import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import SectionTitle from "@/components/Recipe/SectionTitle";
import Skeleton from "@/components/Recipe/Skeleton";
import Empty from "@/components/Recipe/Empty";
import ErrorBox from "@/components/Recipe/ErrorBox";
import IngredientRow from "@/components/Recipe/IngredientRow";
import RecipeCard from "@/components/Recipe/RecipeCard";
import recipeApi from "@/api/recipeApi";

// 탭 정의
const Tab = { CREATE: "CREATE", LIST: "LIST" };
const cx = (...xs) => xs.filter(Boolean).join(" ");

// React Query 키
const qKeys = {
  myIngredients: ["ingredients", "mine"],
  list: (filter, q) => ["recipes", "list", filter, q],
};

// ------------------ Main Component ------------------
export default function Recipes() {
  const qc = useQueryClient();
  const [tab, setTab] = useState(Tab.CREATE);
  const [selected, setSelected] = useState(() => new Set());
  const [q, setQ] = useState("");

  // 내 재료
  const my = useQuery({
    queryKey: qKeys.myIngredients,
    queryFn: recipeApi.fetchMyIngredients,
  });

  const toggle = (id) =>
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  // 레시피 생성
  const gen = useMutation({
    mutationFn: () => recipeApi.generateRecipes(Array.from(selected)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qKeys.list("have", "") });
      qc.invalidateQueries({ queryKey: qKeys.list("need", "") });
      setTab(Tab.LIST);
      setSelected(new Set());
    },
  });

  // 목록 조회
  const have = useQuery({
    queryKey: qKeys.list("have", q),
    queryFn: () => recipeApi.fetchRecipeList({ filter: "have", q }),
    enabled: tab === Tab.LIST,
  });
  const need = useQuery({
    queryKey: qKeys.list("need", q),
    queryFn: () => recipeApi.fetchRecipeList({ filter: "need", q }),
    enabled: tab === Tab.LIST,
  });

  const more = useMutation({
    mutationFn: recipeApi.recommendMore,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qKeys.list("have", q) });
      qc.invalidateQueries({ queryKey: qKeys.list("need", q) });
    },
  });

  const selCount = selected.size;

  return (
    <div className="mx-auto w-full max-w-full md:max-w-screen-md lg:max-w-4xl min-h-[100dvh] pb-[88px] bg-[#F8F3FF]">
      {/* 헤더 + 탭 */}
      <div className="sticky top-0 z-10 bg-[#F8F3FF]/90 backdrop-blur px-4 md:px-6 lg:px-8 pt-3 pb-2">
        <h1 className="text-center text-lg font-bold">레시피</h1>
        <div className="mt-3 grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-sm">
          <button
            onClick={() => setTab(Tab.CREATE)}
            className={cx(
              "rounded-lg py-2",
              tab === Tab.CREATE ? "bg-white shadow font-semibold" : "text-slate-500"
            )}
          >
            생성
          </button>
          <button
            onClick={() => setTab(Tab.LIST)}
            className={cx(
              "rounded-lg py-2",
              tab === Tab.LIST ? "bg-white shadow font-semibold" : "text-slate-500"
            )}
          >
            목록
          </button>
        </div>
      </div>

      {/* 본문 */}
      <div className="px-4 md:px-6 lg:px-8 pt-3">
        {tab === Tab.CREATE ? (
          <>
            {my.isLoading && <div className="py-10 text-center text-slate-500">불러오는 중…</div>}
            {my.isError && <ErrorBox error={my.error} />}
            {!my.isLoading && !my.isError && (
              my.data.length === 0 ? (
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
              )
            )}
          </>
        ) : (
          <>
            {/* 검색 */}
            <div className="mb-3 flex items-center rounded-xl border px-3 py-2 bg-white">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="재료명과 레시피를 검색하세요."
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>

            {/* 있는 식재료로 만든 레시피 */}
            <SectionTitle>있는 식재료로 만든 레시피</SectionTitle>
            {have.isLoading ? (
              <Skeleton />
            ) : have.isError ? (
              <ErrorBox error={have.error} />
            ) : have.data.length === 0 ? (
              <Empty text="조건에 맞는 레시피가 없어요." />
            ) : (
              <div className="space-y-3">
                {have.data.map((r) => (
                  <RecipeCard key={r.id} r={r} />
                ))}
              </div>
            )}

            {/* 다른 레시피 추천받기 */}
            <div className="my-5 flex justify-center">
              <button
                onClick={() => more.mutate()}
                disabled={more.isPending}
                className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-indigo-700 disabled:opacity-60"
              >
                {more.isPending && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                )}
                다른 레시피 추천받기!
              </button>
            </div>

            {/* 식재료가 필요한 레시피 */}
            <SectionTitle>식재료가 필요한 레시피</SectionTitle>
            {need.isLoading ? (
              <Skeleton />
            ) : need.isError ? (
              <ErrorBox error={need.error} />
            ) : need.data.length === 0 ? (
              <Empty text="추가 식재료가 필요한 레시피가 없어요." />
            ) : (
              <div className="space-y-3 mb-10">
                {need.data.map((r) => (
                  <RecipeCard key={r.id} r={r} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ▼▼ 슬라이드 업 바: 선택 전 완전 비가시화 → 사라질 때도 부드럽게 */}
      <div
        className={cx(
          "fixed inset-x-0 bottom-[calc(64px+32px)] z-[999]",
          // translate + opacity 모두 부드럽게
          "transform-gpu transition-all duration-300 ease-in-out",
          "pointer-events-none",
          selCount > 0
            ? "translate-y-0 opacity-100"
            : "translate-y-[140%] opacity-0"
        )}
      >
        <div className="mx-auto max-w-full md:max-w-screen-md lg:max-w-4xl px-4 md:px-6 lg:px-8">
          <button
            onClick={() => gen.mutate()}
            disabled={gen.isPending || selCount === 0}
            className="pointer-events-auto flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-white shadow-lg disabled:opacity-60"
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
    </div>
  );
}
