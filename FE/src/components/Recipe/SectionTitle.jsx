// src/components/Recipe/SectionTitle.jsx
export default function SectionTitle({ children, className = '' }) {
  return (
    <div className={`mt-6 mb-3 flex items-center gap-2 text-xs text-slate-700 ${className}`}>
      {/* 왼쪽 포인트 아이콘 */}
      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-50">
        <div className="h-2 w-2 rounded-full bg-violet-500" />
      </div>

      {/* 제목 텍스트 */}
      <h2 className="text-[13px] font-semibold text-slate-800 md:text-sm">{children}</h2>

      {/* 오른쪽 라인 */}
      <div className="ml-2 hidden h-px flex-1 rounded-full bg-slate-200 md:block" />
    </div>
  );
}
