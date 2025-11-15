export default function ErrorBox({ error }) {
  return (
    <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 md:text-sm">
      <span className="mt-[2px] inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
        !
      </span>
      <p className="leading-relaxed">
        오류가 발생했습니다. <span className="font-medium">{String(error?.message ?? '')}</span>
      </p>
    </div>
  );
}
