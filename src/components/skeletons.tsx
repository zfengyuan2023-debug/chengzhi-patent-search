import { Skeleton } from "@/components/ui/skeleton";

export function SearchSkeleton() {
  return (
    <div className="grid gap-4" aria-hidden="true">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-28 w-full" />
      <div className="grid gap-3 lg:grid-cols-3">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
      <Skeleton className="h-24" />
      <Skeleton className="h-24" />
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="grid gap-4" aria-hidden="true">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-36 w-full" />
      <Skeleton className="h-28 w-full" />
    </div>
  );
}
