import { Briefcase, Calendar, Check, ChevronRight, Instagram, Linkedin, Loader2, Phone, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DbApplication } from "@/hooks/useJobs";
import type { DbProfile } from "@/hooks/useFrela";
import { DbProfissionalDados, instagramUrl, parseDisponibilidade, selosDe } from "@/hooks/usePerfil";
import Selos from "./Selos";
import UserAvatar from "@/components/frela/UserAvatar";
import StatusBadge from "@/components/frela/StatusBadge";

interface Props {
  application: DbApplication;
  perfil?: DbProfile;
  dados?: DbProfissionalDados;
  trabalhos?: number;
  podeDecidir: boolean;
  processando: "aceitar" | "recusar" | null;
  bloqueado: boolean;
  onVerPerfil: () => void;
  onAceitar: () => void;
  onRecusar: () => void;
}

const Info = ({ titulo, texto }: { titulo: string; texto?: string | null }) =>
  texto ? (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{titulo}</p>
      <p className="text-sm text-foreground/90 line-clamp-2">{texto}</p>
    </div>
  ) : null;

/** Cartão de candidato com o "currículo" resumido — a empresa decide sem precisar adivinhar. */
const CandidateCard = ({ application, perfil, dados, trabalhos, podeDecidir, processando, bloqueado, onVerPerfil, onAceitar, onRecusar }: Props) => {
  const nome = perfil?.nome || "Profissional";
  const media = Number(perfil?.avaliacao_media ?? 0);
  const totalAval = perfil?.total_avaliacoes ?? 0;
  const disp = parseDisponibilidade(dados?.disponibilidade);
  const dispTexto = [disp.dias.join(", "), disp.periodos.join(", "), disp.obs].filter(Boolean).join(" · ");

  return (
    <article className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
      <button onClick={onVerPerfil} className="w-full text-left p-4">
        <div className="flex gap-3">
          <UserAvatar nome={nome} fotoUrl={perfil?.foto_url} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display font-bold text-foreground leading-tight">{nome}</h3>
              <StatusBadge status={application.status} />
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {totalAval > 0 ? <><b className="text-foreground">{media.toFixed(1)}</b> ({totalAval})</> : "Novo no FreLa"}
              </span>
              <span className="flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" /> {trabalhos ?? 0} trabalho{trabalhos === 1 ? "" : "s"}
              </span>
            </div>
            {perfil && <Selos selos={selosDe(perfil, trabalhos).filter((x) => x.tipo === "verificado" || x.tipo === "top")} size="sm" className="mt-1.5" />}
            {dados?.profissoes && dados.profissoes.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {dados.profissoes.slice(0, 4).map((p) => (
                  <span key={p} className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary">{p}</span>
                ))}
                {dados.profissoes.length > 4 && <span className="text-[11px] text-muted-foreground">+{dados.profissoes.length - 4}</span>}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2.5 mt-4">
          <Info titulo="Experiência" texto={dados?.experiencia} />
          <Info titulo="Sobre" texto={dados?.bio} />
          {dispTexto && (
            <p className="text-sm text-foreground/90 flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-primary shrink-0" /> <span className="line-clamp-1">{dispTexto}</span>
            </p>
          )}
          {!dados && <p className="text-sm text-muted-foreground">Este profissional ainda não preencheu o currículo.</p>}
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex gap-2">
            {dados?.instagram && (
              <a href={instagramUrl(dados.instagram)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                aria-label="Instagram" className="w-8 h-8 rounded-lg border border-border flex items-center justify-center">
                <Instagram className="h-4 w-4 text-pink-600" />
              </a>
            )}
            {dados?.linkedin && (
              <a href={dados.linkedin} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                aria-label="LinkedIn" className="w-8 h-8 rounded-lg border border-border flex items-center justify-center">
                <Linkedin className="h-4 w-4 text-sky-700" />
              </a>
            )}
            {application.status === "aceita" && perfil?.telefone && (
              <a href={`tel:${perfil.telefone}`} onClick={(e) => e.stopPropagation()}
                className="h-8 px-3 rounded-lg border border-border flex items-center gap-1.5 text-sm text-primary">
                <Phone className="h-4 w-4" /> {perfil.telefone}
              </a>
            )}
          </div>
          <span className="text-sm font-medium text-primary flex items-center">
            Ver perfil completo <ChevronRight className="h-4 w-4" />
          </span>
        </div>
      </button>

      {podeDecidir && (
        <div className="flex gap-2 px-4 pb-4">
          <Button variant="outline" onClick={onRecusar} disabled={bloqueado}
            className="h-11 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10">
            {processando === "recusar" ? <Loader2 className="h-4 w-4 animate-spin" /> : <><X className="h-4 w-4 mr-1" /> Recusar</>}
          </Button>
          <Button onClick={onAceitar} disabled={bloqueado} className="flex-1 h-11 rounded-xl font-semibold">
            {processando === "aceitar" ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 mr-1" /> Aceitar</>}
          </Button>
        </div>
      )}
    </article>
  );
};

export default CandidateCard;
