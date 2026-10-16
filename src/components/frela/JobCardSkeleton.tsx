import { Skeleton } from "@/components/ui/skeleton";

const JobCardSkeleton = () => (
  <div className="bg-card rounded-2xl p-4 border border-border">
    <div className="flex gap-3">
      <Skeleton className="h-12 w-12 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-5 w-16" />
    </div>
    <div className="flex gap-2 mt-4">
      <Skeleton className="h-6 w-16 rounded-lg" />
      <Skeleton className="h-6 w-24 rounded-lg" />
      <Skeleton className="h-6 w-20 rounded-lg" />
    </div>
  </div>
);

export const JobListSkeleton = ({ n = 3 }: { n?: number }) => (
  <div className="space-y-3">{Array.from({ length: n }, (_, i) => <JobCardSkeleton key={i} />)}</div>
);

export default JobCardSkeleton;
