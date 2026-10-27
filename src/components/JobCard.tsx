import { BadgeCheck, CalendarDays, MapPin, Star, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import type { DbJob } from "@/hooks/useJobs";
import type { DbProfile } from "@/hooks/useFrela";
import { formatBRL } from "@/hooks/useFrela";
import { categoriaDe } from "@/lib/categorias";
import { formatDistancia } from "@/lib/geo";
import { ICONE_PERIODO, dataAmigavel, ehNova, periodoDe } from "@/lib/vagas";
import UserAvatar from "@/components/frela/UserAvatar";
import SalvarVagaButton from "@/components/frela/SalvarVagaButton";
import { cn } from "@/lib/utils";

interface JobCardProps {
  job: DbJob;
  index?: number;
  /** Perfil da empresa (foto, nota, selo). */
  empresa?: DbProfile | null;
  /** Compatibilidade: usados quando não há o perfil completo */
  fotoEmpresa?: string | null;
  notaEmpresa?: number | null;
  totalAvaliacoesEmpresa?: number | null;
  /** Distância do usuário até o local da vaga */
  distanciaKm?: number | null;
  /** Visual compacto (carrossel / resumo do pin no mapa) */
  compacto?: boolean;
  onClick?: () => void;
}

/** Card de vaga: valor em destaque, empresa com foto e selo, quando, onde e a que distância. */
const JobCard = ({ job, index = 0, empresa, fotoEmpresa, notaEmpresa, totalAvaliacoesEmpresa, distanciaKm, compacto, onClick }: JobCardProps) => {
  const navigate = useNavigate();
  const cat = categoriaDe(job.category);
  const quando = dataAmigavel(job.date);
  const urgente = quando === "Hoje" || quando === "Amanhã";
  const periodo = periodoDe(job.time_start);
  const IconePeriodo = periodo ? ICONE_PERIODO[periodo] : CalendarDays;
  const nota = Number(empresa?.avaliacao_media ?? notaEmpresa ?? 0);
  const totalAval = empresa?.total_avaliacoes ?? totalAvaliacoesEmpresa ?? 0;
  const distancia = formatDistancia(distanciaKm);
  const abrir = onClick ?? (() => navigate(`/job/${job.id}`));

  return (
    <motion.article
      role="link"
      tabIndex={0}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.985 }}
      transition={{ delay: Math.min(index, 6) * 0.04, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      onClick={abrir}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), abrir())}
      aria-label={`${job.title}, ${formatBRL(job.payment)}, ${job.company_name}`}
      className={cn("group relative w-full text-left bg-card rounded-3xl border border-border/70 shadow-card cursor-pointer",
        "hover:shadow-lg hover:border-primary/30 transition-[box-shadow,border-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        compacto ? "p-3.5" : "p-4")}
    >
      {/* Empresa */}
      <div className="flex items-center gap-2.5 pr-10">
        <UserAvatar nome={job.company_name} fotoUrl={empresa?.foto_url ?? fotoEmpresa} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate flex items-center gap-1">
            <span className="truncate">{job.company_name}</span>
            {empresa?.verificado && <BadgeCheck className="h-4 w-4 text-primary shrink-0" aria-label="Empresa verificada" />}
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            {totalAval > 0 ? (
              <span className="inline-flex items-center gap-0.5 font-medium text-foreground/80">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {nota.toFixed(1)}
                <span className="text-muted-foreground font-normal">({totalAval})</span>
              </span>
            ) : (
              <span>Nova no FreLa</span>
            )}
            {distancia && <><span aria-hidden>·</span><span className="font-medium text-foreground/80">{distancia}</span></>}
          </p>
        </div>
      </div>
      <SalvarVagaButton jobId={job.id} className="absolute top-3 right-3" />

      {/* Vaga */}
      <h3 className={cn("font-display font-bold text-foreground leading-snug line-clamp-2 mt-3", compacto ? "text-base" : "text-[17px]")}>{job.title}</h3>
      <div className="flex flex-wrap items-center gap-1.5 mt-2">
        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold", cat?.cor ?? "bg-primary/10 text-primary")}>
          {cat && <cat.icon className="h-3 w-3" />}
          {job.skill && job.skill !== job.category ? job.skill : cat?.curto ?? job.category}
        </span>
        {ehNova(job.created_at) && <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-100 text-sky-800">Nova</span>}
        {job.slots_remaining > 1 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-muted text-foreground/80">
            <Users className="h-3 w-3" /> {job.slots_remaining} vagas
          </span>
        )}
      </div>

      {/* Quando, onde e quanto */}
      <div className="mt-3 pt-3 border-t border-dashed border-border flex items-end justify-between gap-3">
        <div className="min-w-0 space-y-1 text-[13px]">
          <p className="flex items-center gap-1.5 text-foreground">
            <IconePeriodo className={cn("h-3.5 w-3.5 shrink-0", urgente ? "text-amber-600" : "text-muted-foreground")} />
            <span className={cn("font-semibold", urgente && "text-amber-700")}>{quando}</span>
            <span className="text-muted-foreground">· {job.time_start}–{job.time_end}</span>
          </p>
          {(job.neighborhood || job.address) && (
            <p className="flex items-center gap-1.5 text-muted-foreground min-w-0">
              <MapPin className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{job.neighborhood || job.address}</span>
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="font-display font-extrabold text-xl text-primary leading-none tabular-nums">{formatBRL(job.payment)}</p>
          <p className="text-[11px] text-muted-foreground mt-1">pelo serviço</p>
        </div>
      </div>
    </motion.article>
  );
};

export default JobCard;
