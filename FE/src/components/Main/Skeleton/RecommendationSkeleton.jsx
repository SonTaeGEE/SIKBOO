import { Skeleton } from '@/components/ui/skeleton';

export function RecommendationSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-linear-to-br from-violet-50 to-indigo-50 px-5 py-4 shadow-sm">
      <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}
