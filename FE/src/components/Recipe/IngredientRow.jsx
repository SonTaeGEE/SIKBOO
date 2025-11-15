const cx = (...xs) => xs.filter(Boolean).join(' ');

export default function IngredientRow({ it, selected, onToggle }) {
  return (
    <li className="flex items-center justify-between border-b border-slate-100 py-3 last:border-b-0">
      <span className="text-[14px] text-slate-800 md:text-[15px]">{it.name}</span>
      <button
        onClick={() => onToggle(it.id)}
        className={cx(
          'rounded-full px-3 py-1 text-[12px] font-medium shadow-sm transition md:text-sm',
          selected
            ? 'border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'
            : 'border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100',
        )}
      >
        {selected ? '삭제' : '추가'}
      </button>
    </li>
  );
}
