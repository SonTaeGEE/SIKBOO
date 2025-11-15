export default function SectionTitle({ children, className = '' }) {
  return (
    <div className={`mt-6 mb-2 flex items-center gap-2 ${className}`}>
      <div className="h-[10px] w-[3px] rounded-full bg-violet-500" />
      <h2 className="text-[13px] font-semibold text-slate-800 md:text-sm">{children}</h2>
    </div>
  );
}
