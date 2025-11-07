const cx = (...xs) => xs.filter(Boolean).join(" ");

export default function IngredientRow({ it, selected, onToggle }) {
  return (
    <li className="flex items-center justify-between py-3">
      <span className="text-[15px]">{it.name}</span>
      <button
        onClick={() => onToggle(it.id)}
        className={cx(
          "rounded-full px-3 py-1 text-sm transition",
          selected ? "bg-red-100 text-red-600" : "bg-indigo-100 text-indigo-700"
        )}
      >
        {selected ? "삭제" : "추가"}
      </button>
    </li>
  );
}
