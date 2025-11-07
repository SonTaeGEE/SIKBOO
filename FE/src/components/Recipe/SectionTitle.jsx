export default function SectionTitle({ children, className = "" }) {
  return (
    <div className={`mt-4 mb-2 text-[13px] font-semibold text-slate-700 ${className}`}>
      {children}
    </div>
  );
}
