import { Skeleton } from "@/components/ui/skeleton";

/** Esqueleto do card de vaga (mesmo formato do JobCard). */
const JobCardSkeleton = () => (
  <div className="bg-card rounded-3xl p-4 border border-border/70 shadow-card" aria-hidden>
    <div className="flex items-center gap-2.5">
      <Skeleton className="h-9 w-9 rounded-lg" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-1/3" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      <Skeleton className="h-9 w-9 rounded-full" />
    </div>
    <Skeleton className="h-5 w-4/5 mt-4" />
    <Skeleton className="h-5 w-20 rounded-full mt-2.5" />
    <div className="flex justify-between items-end mt-4 pt-3 border-t border-dashed border-border">
      <div className="space-y-1.5">
        <Skeleton className="h-3.5 w-36" />
        <Skeleton className="h-3.5 w-24" />
      </div>
      <Skeleton className="h-6 w-24" />
    </div>
  </div>
);

export const JobListSkeleton = ({ n = 3 }: { n?: number }) => (
  <div className="space-y-3" role="status" aria-label="Carregando vagas">
    {Array.from({ length: n }, (_, i) => <JobCardSkeleton key={i} />)}
  </div>
);

export default JobCardSkeleton;
