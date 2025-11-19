import { Skeleton } from '@/components/ui/skeleton';

export function GroupBuyingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <GroupBuyingCardSkeleton />
      <GroupBuyingCardSkeleton />
    </div>
  );
}

function GroupBuyingCardSkeleton() {
  return (
    <div className="flex flex-col rounded-2xl bg-white px-4 py-3 shadow-sm">
      <div className="mb-2 flex items-start justify-between gap-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
      <div className="mb-2 flex items-center gap-2">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-3 w-40" />
    </div>
  );
}
