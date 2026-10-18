import { STATUS_TAXA, StatusTaxa } from "@/lib/pagamentos";
import { cn } from "@/lib/utils";

const TaxaStatusBadge = ({ status, className }: { status?: string | null; className?: string }) => {
  if (!status || !(status in STATUS_TAXA)) return null;
  const s = STATUS_TAXA[status as StatusTaxa];
  return <span className={cn("shrink-0 px-2.5 py-1 rounded-md text-xs font-semibold", s.cls, className)}>{s.label}</span>;
};

export default TaxaStatusBadge;
