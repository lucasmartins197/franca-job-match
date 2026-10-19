import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const brl = (v?: number | null) => (Number(v ?? 0)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const data = (iso?: string | null) => (iso ? new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString("pt-BR") : "—");
export const pct = (v?: number | null) => `${(Number(v ?? 0) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;

export const TituloPagina = ({ titulo, sub, direita }: { titulo: string; sub?: string; direita?: ReactNode }) => (
  <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
    <div>
      <h1 className="text-2xl font-display font-bold text-foreground">{titulo}</h1>
      {sub && <p className="text-sm text-muted-foreground mt-0.5">{sub}</p>}
    </div>
    {direita}
  </div>
);

/** Card de número (KPI). */
export const Stat = ({ titulo, valor, sub, icon: Icon, tom = "padrao", carregando }: {
  titulo: string; valor: ReactNode; sub?: ReactNode; icon?: LucideIcon; tom?: "padrao" | "alerta" | "perigo" | "destaque"; carregando?: boolean;
}) => (
  <div className={cn("rounded-2xl border p-4 bg-card shadow-card",
    tom === "perigo" ? "border-destructive/30" : tom === "alerta" ? "border-amber-300" : tom === "destaque" ? "border-primary/30 bg-primary/5" : "border-border")}>
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs font-medium text-muted-foreground">{titulo}</p>
      {Icon && <Icon className={cn("h-4 w-4", tom === "perigo" ? "text-destructive" : tom === "alerta" ? "text-amber-600" : "text-primary")} />}
    </div>
    {carregando ? <Skeleton className="h-8 w-24 mt-2" /> : <p className="text-2xl font-display font-bold text-foreground mt-1 tabular-nums">{valor}</p>}
    {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
  </div>
);

export const Secao = ({ titulo, children, direita, className }: { titulo: string; children: ReactNode; direita?: ReactNode; className?: string }) => (
  <section className={cn("bg-card border border-border rounded-2xl p-4 lg:p-5 shadow-card min-w-0", className)}>
    <div className="flex items-center justify-between gap-2 mb-3">
      <h2 className="font-display font-bold text-foreground">{titulo}</h2>
      {direita}
    </div>
    {children}
  </section>
);

const CHIP: Record<string, string> = {
  ok: "bg-emerald-100 text-emerald-800",
  perto: "bg-amber-100 text-amber-800",
  travada: "bg-destructive/10 text-destructive",
  ativo: "bg-emerald-100 text-emerald-800",
  inativo: "bg-muted text-muted-foreground",
  assinante: "bg-primary/10 text-primary",
  demo: "bg-violet-100 text-violet-800",
};

export const Chip = ({ tipo, children }: { tipo: keyof typeof CHIP | string; children: ReactNode }) => (
  <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap", CHIP[tipo] ?? "bg-muted text-muted-foreground")}>{children}</span>
);

export const SelectFiltro = ({ valor, onChange, opcoes, rotulo }: {
  valor: string; onChange: (v: string) => void; opcoes: { valor: string; label: string }[]; rotulo: string;
}) => (
  <select aria-label={rotulo} value={valor} onChange={(e) => onChange(e.target.value)}
    className="h-10 rounded-xl border border-input bg-card px-3 text-sm">
    {opcoes.map((o) => <option key={o.valor} value={o.valor}>{o.label}</option>)}
  </select>
);
