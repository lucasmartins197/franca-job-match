import { useNavigate } from "react-router-dom";
import { ChevronRight, KeyRound, Star } from "lucide-react";
import { Pendencia, textoPendencia, usePendencias } from "@/hooks/useConfirmacao";
import { cn } from "@/lib/utils";

/**
 * Avisos do que falta fazer para fechar o ciclo (código / avaliação).
 * `soBloqueantes` mostra só o que trava o uso do app.
 */
const PendenciasAviso = ({ className, soBloqueantes = true, tipos }: { className?: string; soBloqueantes?: boolean; tipos?: Pendencia["tipo"][] }) => {
  const navigate = useNavigate();
  const { lista } = usePendencias();
  const itens = lista.filter((p) => (!soBloqueantes || p.bloqueia) && (!tipos || tipos.includes(p.tipo)));
  if (itens.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      {itens.map((p) => {
        const t = textoPendencia(p);
        const Icon = p.tipo === "avaliar" ? Star : KeyRound;
        return (
          <button key={`${p.tipo}-${p.contratacao_id}`}
            onClick={() => navigate(`/contratacao/${p.contratacao_id}${p.tipo === "avaliar" ? "#avaliacao" : ""}`)}
            className="w-full text-left rounded-2xl border-2 border-amber-300 bg-amber-50 p-3.5 flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
              <Icon className={cn("h-5 w-5", p.tipo === "avaliar" && "fill-amber-500 text-amber-700")} />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-bold text-amber-950">{t.titulo}</span>
              <span className="block text-xs text-amber-900">{t.descricao}</span>
            </span>
            <span className="shrink-0 inline-flex items-center text-xs font-bold text-amber-950">
              <span className="hidden min-[380px]:inline">{t.acao}</span> <ChevronRight className="h-4 w-4" />
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default PendenciasAviso;
