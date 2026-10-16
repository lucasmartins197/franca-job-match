import { MapPin, Clock, CalendarDays, Star } from "lucide-react";
import { categoriaDe } from "@/lib/categorias";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import type { DbJob } from "@/hooks/useJobs";
import { formatBRL } from "@/hooks/useFrela";
import UserAvatar from "@/components/frela/UserAvatar";

interface JobCardProps {
  job: DbJob;
  index?: number;
  fotoEmpresa?: string | null;
  /** Reputação da empresa (profiles.avaliacao_media / total_avaliacoes) */
  notaEmpresa?: number | null;
  totalAvaliacoesEmpresa?: number | null;
  onClick?: () => void;
}

/** "Hoje", "Amanhã" ou "sex, 24/10". */
const dataAmigavel = (date: string) => {
  const d = new Date(`${date}T12:00:00`);
  const hoje = new Date();
  hoje.setHours(12, 0, 0, 0);
  const diff = Math.round((d.getTime() - hoje.getTime()) / 86_400_000);
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Amanhã";
  return d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" }).replace(".", "");
};

const JobCard = ({ job, index = 0, fotoEmpresa, notaEmpresa, totalAvaliacoesEmpresa, onClick }: JobCardProps) => {
  const cat = categoriaDe(job.category);
  const navigate = useNavigate();
  const quando = dataAmigavel(job.date);
  const urgente = quando === "Hoje" || quando === "Amanhã";

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.04, duration: 0.25 }}
      onClick={onClick ?? (() => navigate(`/job/${job.id}`))}
      className="w-full text-left bg-card rounded-2xl p-4 border border-border shadow-card hover:border-primary/40 active:scale-[0.99] transition-all"
    >
      <div className="flex items-start gap-3">
        <UserAvatar nome={job.company_name} fotoUrl={fotoEmpresa} size="md" />
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-foreground leading-snug line-clamp-2">{job.title}</h3>
          <p className="text-sm text-muted-foreground truncate flex items-center gap-1.5">
            <span className="truncate">{job.company_name}</span>
            {!!totalAvaliacoesEmpresa && (
              <span className="inline-flex items-center gap-0.5 text-foreground font-semibold shrink-0">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {Number(notaEmpresa ?? 0).toFixed(1)}
              </span>
            )}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-display font-extrabold text-lg text-primary leading-none">{formatBRL(job.payment)}</p>
          <p className="text-[11px] text-muted-foreground mt-1">pelo serviço</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mt-3">
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${urgente ? "bg-warning/15 text-amber-800" : "bg-muted text-foreground/80"}`}>
          <CalendarDays className="h-3.5 w-3.5" /> {quando}
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-muted text-foreground/80">
          <Clock className="h-3.5 w-3.5" /> {job.time_start}–{job.time_end}
        </span>
        {(job.neighborhood || job.address) && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-muted text-foreground/80 max-w-full">
            <MapPin className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{job.neighborhood || job.address}</span>
          </span>
        )}
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${cat?.cor ?? "bg-primary/10 text-primary"}`}>
          {cat && <cat.icon className="h-3.5 w-3.5" />}
          {job.skill && job.skill !== job.category ? job.skill : cat?.curto ?? job.category}
        </span>
      </div>
    </motion.button>
  );
};

export default JobCard;
