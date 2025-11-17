import { useState } from 'react';

export default function RecipeCard({ r }) {
  const [open, setOpen] = useState(false);

  const hasMissing = Array.isArray(r.missing) && r.missing.length > 0;

  const badgeLabel = hasMissing ? '추가 식재료 필요' : '있는 재료만 사용';
  const badgeDotClass = hasMissing ? 'bg-[#DC2626]' : 'bg-[#6366F1]';
  const badgeColorClass = hasMissing
    ? 'bg-[#FEF2F2] text-[#DC2626]'
    : 'bg-[#EEF2FF] text-[#4F46E5]';

  const cardBorderClass = hasMissing
    ? 'border-rose-200 hover:border-rose-300'
    : 'border-violet-200 hover:border-violet-300';

  return (
    <div
      className={`rounded-2xl border bg-white px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${cardBorderClass}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {/* 제목 + 상태 뱃지 */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="truncate text-sm font-semibold text-slate-900">{r.title}</div>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${badgeColorClass}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${badgeDotClass}`} />
              <span>{badgeLabel}</span>
            </span>
          </div>

          {/* 없는 식재료 간단 요약 */}
          {hasMissing && (
            <div className="text-[11px] text-slate-500">
              없는 식재료:{' '}
              <span className="font-medium text-[#DC2626]">{r.missing.join(', ')}</span>
            </div>
          )}
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="shrink-0 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
        >
          {open ? '레시피 접기' : '레시피 보기'}
        </button>
      </div>

      {open && (
        <div className="mt-3 space-y-3 text-[13px] leading-5 text-slate-700">
          {r.mainIngredients?.length > 0 && (
            <section>
              <div className="mb-1 text-xs font-semibold text-slate-800">메인 재료</div>
              <ul className="list-disc pl-5 text-[13px]">
                {r.mainIngredients.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </section>
          )}

          {r.seasoningIngredients?.length > 0 && (
            <section>
              <div className="mb-1 text-xs font-semibold text-slate-800">양념장 재료</div>
              <ul className="list-disc pl-5 text-[13px]">
                {r.seasoningIngredients.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </section>
          )}

          {r.content && (
            <section>
              <div className="mb-1 text-xs font-semibold text-slate-800">조리 방법</div>
              <div className="text-[13px] leading-6 whitespace-pre-wrap text-slate-700">
                {r.content}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
