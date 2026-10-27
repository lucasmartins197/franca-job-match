import { Heart, LocateFixed, Moon, SlidersHorizontal, Sun, TrendingUp, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useFiltrosVagas } from "@/hooks/useVagas";
import { useLocalizacao } from "@/hooks/useLocalizacao";
import { FiltrosVagas, contarFiltros } from "@/lib/filtrosVagas";
import { cn } from "@/lib/utils";

interface Atalho {
  id: string;
  label: string;
  icon: typeof Zap;
  ativo: (f: FiltrosVagas) => boolean;
  alternar: (f: FiltrosVagas) => FiltrosVagas;
  precisaLocal?: boolean;
}

const ATALHOS: Atalho[] = [
  { id: "perto", label: "Perto de mim", icon: LocateFixed, precisaLocal: true,
    ativo: (f) => f.raioKm != null && f.raioKm <= 5,
    alternar: (f) => (f.raioKm != null && f.raioKm <= 5 ? { ...f, raioKm: null } : { ...f, raioKm: 5, ordem: "distancia" }) },
  { id: "hoje", label: "Hoje", icon: Zap, ativo: (f) => f.data === "hoje", alternar: (f) => ({ ...f, data: f.data === "hoje" ? "todas" : "hoje" }) },
  { id: "valor", label: "Melhor pago", icon: TrendingUp, ativo: (f) => f.ordem === "valor", alternar: (f) => ({ ...f, ordem: f.ordem === "valor" ? "distancia" : "valor" }) },
  { id: "fds", label: "Fim de semana", icon: Sun, ativo: (f) => f.data === "fds", alternar: (f) => ({ ...f, data: f.data === "fds" ? "todas" : "fds" }) },
  { id: "noite", label: "À noite", icon: Moon,
    ativo: (f) => f.periodos.length === 1 && f.periodos[0] === "Noite",
    alternar: (f) => ({ ...f, periodos: f.periodos.length === 1 && f.periodos[0] === "Noite" ? [] : ["Noite"] }) },
  { id: "salvas", label: "Salvas", icon: Heart, ativo: (f) => f.somenteSalvas, alternar: (f) => ({ ...f, somenteSalvas: !f.somenteSalvas }) },
];

/** Chips de filtro rápido + botão "Filtros" (abre a gaveta). */
const AtalhosFiltro = ({ onAbrirFiltros, className }: { onAbrirFiltros: () => void; className?: string }) => {
  const { filtros, setFiltros } = useFiltrosVagas();
  const loc = useLocalizacao();
  const n = contarFiltros(filtros);

  const tocar = (a: Atalho) => {
    if (a.precisaLocal && !loc.real && !a.ativo(filtros)) {
      loc.pedir();
      if (loc.status === "negado") toast.info("Ative a localização do FreLa nas configurações do celular para ver as vagas perto de você.");
    }
    setFiltros(a.alternar);
  };

  return (
    <div className={cn("flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 py-0.5", className)} role="toolbar" aria-label="Filtros rápidos">
      <motion.button whileTap={{ scale: 0.95 }} onClick={onAbrirFiltros}
        className={cn("shrink-0 inline-flex items-center gap-1.5 h-9 pl-3 pr-3.5 rounded-full text-sm font-semibold border transition-colors",
          n > 0 ? "bg-foreground text-background border-foreground" : "bg-card border-border text-foreground")}>
        <SlidersHorizontal className="h-4 w-4" /> Filtros
        {n > 0 && <span className="ml-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-background text-foreground text-[11px] font-bold flex items-center justify-center">{n}</span>}
      </motion.button>
      {ATALHOS.map((a) => {
        const ativo = a.ativo(filtros);
        return (
          <motion.button key={a.id} whileTap={{ scale: 0.95 }} onClick={() => tocar(a)} aria-pressed={ativo}
            className={cn("shrink-0 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-sm font-medium border transition-colors",
              ativo ? "bg-primary text-primary-foreground border-primary shadow-brand" : "bg-card text-foreground border-border")}>
            <a.icon className={cn("h-4 w-4", ativo ? "" : "text-muted-foreground", a.id === "salvas" && ativo && "fill-current")} /> {a.label}
          </motion.button>
        );
      })}
    </div>
  );
};

export default AtalhosFiltro;
