export function Section({ title, subtitle, rightContent, children }) {
  return (
    <section className="mb-6">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900 md:text-lg">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500 md:text-sm">{subtitle}</p>}
        </div>
        {rightContent && <div className="shrink-0 text-xs text-slate-500">{rightContent}</div>}
      </div>
      {children}
    </section>
  );
}
