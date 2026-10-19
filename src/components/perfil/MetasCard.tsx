import { useNavigate } from "react-router-dom";
import { BadgeCheck, CheckCircle2, Crown, Star, Target } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { Progress } from "@/components/ui/progress";
import { metasDoProfissional } from "@/hooks/usePerfil";
import { cn } from "@/lib/utils";

const ICONE = { indicado: Crown, top: Star, verificado: BadgeCheck };

/** Metas do profissional rumo aos selos, com barra de progresso (estilo gamificação). */
const MetasCard = ({ profile, trabalhos }: { profile: Tables<"profiles">; trabalhos: number }) => {
  const navigate = useNavigate();
  const metas = metasDoProfissional(profile, trabalhos);
  const principal = metas[0];

  return (
    <section className="bg-card border border-border rounded-2xl overflow-hidden shadow-card">
      <div className={cn("p-4", principal.atingida ? "bg-gradient-to-r from-amber-400 to-orange-500 text-white" : "bg-gradient-to-r from-primary to-brand-light text-primary-foreground")}>
        <div className="flex items-center gap-2 text-sm font-semibold opacity-90"><Target className="h-4 w-4" /> Suas metas</div>
        <p className="text-lg font-display font-extrabold mt-1 leading-snug">{principal.dica}</p>
        {!principal.atingida && (
          <>
            <div className="mt-3 h-2.5 rounded-full bg-white/25 overflow-hidden">
              <div className="h-full rounded-full bg-white transition-all" style={{ width: `${principal.progresso}%` }} />
            </div>
            <p className="text-xs mt-1.5 opacity-90">{principal.detalhe}</p>
          </>
        )}
      </div>
      <ul className="divide-y divide-border">
        {metas.map((m) => {
          const Icone = ICONE[m.id];
          return (
            <li key={m.id} className="p-4 flex gap-3">
              <span className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                m.atingida ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white" : "bg-muted text-muted-foreground")}>
                <Icone className="h-5 w-5" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-foreground">{m.titulo}</p>
                  {m.atingida
                    ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Conquistado</span>
                    : <span className="text-xs text-muted-foreground">{Math.round(m.progresso)}%</span>}
                </div>
                <p className="text-xs text-muted-foreground">{m.detalhe}</p>
                {!m.atingida && m.id !== "verificado" && <Progress value={m.progresso} className="h-1.5 mt-2" />}
                {!m.atingida && (
                  m.id === "verificado"
                    ? <button onClick={() => navigate("/suporte")} className="text-xs font-semibold text-primary mt-1">{m.dica}</button>
                    : <p className="text-xs text-foreground/80 mt-1">{m.dica}</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="px-4 pb-4 text-[11px] text-muted-foreground">
        Profissionais com selo <b>Indicado</b> ou <b>Verificado</b> aparecem primeiro nas recomendações e buscas das empresas.
      </p>
    </section>
  );
};

export default MetasCard;
