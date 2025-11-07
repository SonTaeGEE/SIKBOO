export default function Skeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
      ))}
    </div>
  );
}
