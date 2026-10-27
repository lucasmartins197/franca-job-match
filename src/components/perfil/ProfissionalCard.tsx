import { motion } from "framer-motion";
import { Briefcase, ChevronRight, MapPin, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ProfissionalRecomendado, selosRecomendado } from "@/hooks/useRecomendacoes";
import UserAvatar from "@/components/frela/UserAvatar";
import Selos from "@/components/perfil/Selos";
import { cn } from "@/lib/utils";

const MEDALHA = ["bg-amber-400 text-amber-950", "bg-slate-300 text-slate-800", "bg-orange-300 text-orange-900"];

/** Card de profissional (vitrine): foto, nome, selos, nota, trabalhos e profissões. */
const ProfissionalCard = ({ p, posicao, index = 0 }: { p: ProfissionalRecomendado; posicao?: number; index?: number }) => {
  const navigate = useNavigate();
  const profissoes = p.profissoes ?? [];
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.985 }}
      transition={{ delay: Math.min(index, 6) * 0.04, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => navigate(`/perfil/${p.id}`)}
      className={cn("w-full text-left bg-card rounded-3xl border p-4 shadow-card hover:shadow-lg transition-shadow",
        p.indicado ? "border-amber-300 bg-gradient-to-br from-amber-50/60 to-card" : "border-border/70")}
    >
      <div className="flex gap-3.5 items-start">
        <div className="relative shrink-0">
          <UserAvatar nome={p.nome} fotoUrl={p.foto_url} size="lg" />
          {posicao != null && (
            <span className={cn("absolute -top-2 -left-2 w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center border-2 border-card",
              MEDALHA[posicao - 1] ?? "bg-muted text-muted-foreground")}>
              {posicao}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-[17px] text-foreground truncate">{p.nome}</p>
          <Selos selos={selosRecomendado(p)} size="sm" className="mt-1" />
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="rounded-xl bg-muted/60 px-2 py-1.5 text-center">
              <p className="text-sm font-bold text-foreground inline-flex items-center gap-0.5">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {p.total_avaliacoes ? Number(p.avaliacao_media).toFixed(1) : "—"}
              </p>
              <p className="text-[10px] text-muted-foreground">{p.total_avaliacoes} avaliaç{p.total_avaliacoes === 1 ? "ão" : "ões"}</p>
            </div>
            <div className="rounded-xl bg-muted/60 px-2 py-1.5 text-center">
              <p className="text-sm font-bold text-foreground inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5 text-primary" /> {p.trabalhos}</p>
              <p className="text-[10px] text-muted-foreground">trabalho{p.trabalhos === 1 ? "" : "s"}</p>
            </div>
            <div className="rounded-xl bg-muted/60 px-2 py-1.5 text-center min-w-0">
              <p className="text-sm font-bold text-foreground truncate inline-flex items-center gap-0.5 max-w-full"><MapPin className="h-3.5 w-3.5 text-primary shrink-0" /> <span className="truncate">{p.cidade || "Franca"}</span></p>
              <p className="text-[10px] text-muted-foreground">cidade</p>
            </div>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 self-center" />
      </div>
      {profissoes.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {profissoes.slice(0, 4).map((x) => (
            <span key={x} className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-primary/10 text-primary">{x}</span>
          ))}
          {profissoes.length > 4 && <span className="px-2 py-1 text-[11px] text-muted-foreground">+{profissoes.length - 4}</span>}
        </div>
      )}
    </motion.button>
  );
};

export default ProfissionalCard;
