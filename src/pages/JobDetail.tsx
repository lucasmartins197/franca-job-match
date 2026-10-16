import { useParams, useNavigate } from "react-router-dom";
import { MapPin, Clock, Calendar, Building2, CheckCircle2, Loader2, Users } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useJob, useApply, useMyApplications } from "@/hooks/useJobs";
import { useAuth } from "@/hooks/useAuth";
import { useProfilesByIds, formatBRL, formatDate } from "@/hooks/useFrela";
import PageHeader from "@/components/frela/PageHeader";
import StatusBadge from "@/components/frela/StatusBadge";
import Stars from "@/components/frela/Stars";

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, userTipo } = useAuth();
  const { data: job, isLoading } = useJob(id);
  const applyMutation = useApply();
  const { data: myApplications = [] } = useMyApplications();
  const { data: perfis = {} } = useProfilesByIds(job ? [job.user_id] : []);

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }
  if (!job) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="Detalhes da vaga" />
        <p className="text-center text-muted-foreground py-16">Vaga não encontrada.</p>
      </div>
    );
  }

  const empresa = perfis[job.user_id];
  const isDona = job.user_id === user?.id;
  const minhaCandidatura = myApplications.find((a) => a.job_id === job.id);

  const handleApply = async () => {
    if (!user) return;
    try {
      await applyMutation.mutateAsync({ jobId: job.id, userId: user.id });
      toast.success("Candidatura enviada! A empresa foi notificada.");
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Erro ao candidatar-se");
    }
  };

  const renderAcao = () => {
    if (isDona) {
      return (
        <Button onClick={() => navigate(`/job/${job.id}/candidates`)}
          className="w-full h-14 rounded-xl gradient-brand text-primary-foreground font-display font-bold text-lg shadow-brand">
          <Users className="h-5 w-5 mr-2" /> Ver candidatos
        </Button>
      );
    }
    if (userTipo === "empresa") return null;
    if (minhaCandidatura) {
      const texto = {
        pendente: "Candidatura enviada — aguardando a empresa",
        aceita: "Você foi confirmado(a) nesta vaga!",
        recusada: "Candidatura não selecionada",
      }[minhaCandidatura.status] ?? "Candidatura enviada";
      return (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center justify-center gap-2 h-14">
          <CheckCircle2 className={`h-5 w-5 ${minhaCandidatura.status === "recusada" ? "text-muted-foreground" : "text-success"}`} />
          <span className={`font-display font-bold ${minhaCandidatura.status === "recusada" ? "text-muted-foreground" : "text-success"}`}>{texto}</span>
        </motion.div>
      );
    }
    if (job.status !== "aberta") {
      return <p className="text-center text-muted-foreground h-14 flex items-center justify-center">Esta vaga não está mais aberta</p>;
    }
    return (
      <Button onClick={handleApply} disabled={applyMutation.isPending}
        className="w-full h-14 rounded-xl gradient-brand text-primary-foreground font-display font-bold text-lg shadow-brand hover:opacity-90 transition-opacity">
        {applyMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Candidatar-se"}
      </Button>
    );
  };

  const acao = renderAcao();

  return (
    <div className="min-h-screen bg-background pb-28 max-w-lg mx-auto">
      <PageHeader title="Detalhes da vaga" />

      <div className="px-5">
        <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center text-2xl font-display font-bold text-primary-foreground mb-4">
          {job.company_name.charAt(0).toUpperCase()}
        </div>

        <div className="flex items-start justify-between gap-2 mb-1">
          <h2 className="text-2xl font-display font-bold text-foreground">{job.title}</h2>
          <StatusBadge status={job.status} />
        </div>
        <div className="flex items-center gap-2 text-muted-foreground mb-4">
          <Building2 className="h-4 w-4" />
          <span>{job.company_name}</span>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <span className="px-3 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary">{job.category}</span>
          {job.skill && job.skill !== job.category && (
            <span className="px-3 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground">{job.skill}</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { icon: Calendar, label: "Data", value: formatDate(job.date) },
            { icon: Clock, label: "Horário", value: `${job.time_start} – ${job.time_end}` },
            { icon: MapPin, label: "Local", value: [job.neighborhood, job.address].filter(Boolean).join(" · ") || "Franca/SP" },
          ].map((item) => (
            <div key={item.label} className="bg-card rounded-xl p-3 border border-border shadow-sm">
              <div className="flex items-center gap-1.5 mb-1">
                <item.icon className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs text-muted-foreground">{item.label}</span>
              </div>
              <span className="text-sm font-medium text-foreground">{item.value}</span>
            </div>
          ))}
          <div className="bg-card rounded-xl p-3 border border-primary/20 shadow-sm">
            <span className="text-xs text-muted-foreground block mb-1">Pagamento</span>
            <span className="text-lg font-display font-bold text-primary">{formatBRL(job.payment)}</span>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-display font-bold text-foreground mb-2">Descrição</h3>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{job.description || "Sem descrição fornecida."}</p>
        </div>

        <div className="bg-card rounded-xl p-4 border border-border mb-6 shadow-sm">
          <h3 className="font-display font-bold text-foreground mb-2">Sobre a empresa</h3>
          <p className="text-sm text-muted-foreground mb-2">{job.company_name} — {empresa?.cidade || "Franca"}, SP</p>
          <div className="flex items-center gap-1.5">
            <Stars value={Number(empresa?.avaliacao_media ?? 0)} size="sm" />
            <span className="text-xs text-muted-foreground">
              {empresa?.total_avaliacoes ? `${Number(empresa.avaliacao_media).toFixed(1)} (${empresa.total_avaliacoes} avaliações)` : "Sem avaliações ainda"}
            </span>
          </div>
        </div>
      </div>

      {acao && (
        <div className="fixed bottom-0 left-0 right-0 p-5 bg-background/95 backdrop-blur-lg border-t border-border">
          <div className="max-w-lg mx-auto">{acao}</div>
        </div>
      )}
    </div>
  );
};

export default JobDetail;
