// src/components/Recipe/RecipeCard.jsx
import { useState } from 'react';

export default function RecipeCard({ r }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="font-semibold">{r.title}</div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-full border px-3 py-1 text-sm"
        >
          {open ? '레시피 접기' : '레시피 보기'}
        </button>
      </div>

      {open && (
        <div className="mt-3 space-y-2 text-[13px]">
          {r.mainIngredients?.length > 0 && (
            <>
              <div className="font-medium">메인 재료</div>
              <ul className="list-disc pl-5">
                {r.mainIngredients.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </>
          )}

          {r.seasoningIngredients?.length > 0 && (
            <>
              <div className="mt-2 font-medium">양념장 재료</div>
              <ul className="list-disc pl-5">
                {r.seasoningIngredients.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </>
          )}

          {r.missing?.length > 0 && (
            <div className="mt-2 text-slate-600">없는 식재료 : {r.missing.join(', ')}</div>
          )}

          {r.content && (
            <div className="mt-2 leading-5 whitespace-pre-wrap text-slate-700">{r.content}</div>
          )}
        </div>
      )}
    </div>
  );
}
