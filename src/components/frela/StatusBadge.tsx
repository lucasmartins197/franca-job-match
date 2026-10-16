const STYLES: Record<string, { label: string; className: string }> = {
  // vagas
  aberta: { label: "Aberta", className: "bg-green-100 text-green-700" },
  preenchida: { label: "Preenchida", className: "bg-blue-100 text-blue-700" },
  finalizada: { label: "Finalizada", className: "bg-muted text-muted-foreground" },
  cancelada: { label: "Cancelada", className: "bg-destructive/10 text-destructive" },
  // candidaturas
  pendente: { label: "Pendente", className: "bg-amber-100 text-amber-700" },
  aceita: { label: "Aceita", className: "bg-green-100 text-green-700" },
  recusada: { label: "Recusada", className: "bg-destructive/10 text-destructive" },
  // contratações
  em_andamento: { label: "Em andamento", className: "bg-blue-100 text-blue-700" },
};

const StatusBadge = ({ status }: { status: string }) => {
  const style = STYLES[status] ?? { label: status, className: "bg-muted text-muted-foreground" };
  return (
    <span className={`shrink-0 px-2.5 py-1 rounded-md text-xs font-medium ${style.className}`}>{style.label}</span>
  );
};

export default StatusBadge;
