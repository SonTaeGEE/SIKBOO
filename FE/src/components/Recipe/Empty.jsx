export default function Empty({ text }) {
  return (
    <div className="rounded-2xl border border-dashed border-violet-200 bg-white/70 px-4 py-6 text-center text-xs text-slate-500 md:text-sm">
      <p className="mb-1 font-medium text-slate-600">표시할 내용이 없어요</p>
      <p className="text-[11px] text-slate-400 md:text-xs">{text}</p>
    </div>
  );
}
