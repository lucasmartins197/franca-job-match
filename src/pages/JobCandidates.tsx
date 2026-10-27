import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Users, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DbApplication, useCancelarVaga, useJob, useJobApplications } from "@/hooks/useJobs";
import {
  useAceitarCandidato, useRecusarCandidato, useProfilesByIds, formatBRL, formatDate,
} from "@/hooks/useFrela";
import PageHeader from "@/components/frela/PageHeader";
import StatusBadge from "@/components/frela/StatusBadge";
import CandidateCard from "@/components/perfil/CandidateCard";
import EmptyState from "@/components/frela/EmptyState";
import { relevanciaPerfil, useTrabalhosFinalizados } from "@/hooks/usePerfil";
import PageSkeleton from "@/components/frela/PageSkeleton";

const JobCandidates = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: job, isLoading: loadingJob } = useJob(id);
  const { data: applications = [], isLoading } = useJobApplications(id);
  const candidatoIds = applications.map((a) => a.user_id);
  const { data: perfis = {} } = useProfilesByIds(candidatoIds);
  const { data: trabalhos = {} } = useTrabalhosFinalizados(candidatoIds);
  const { data: dadosProfissionais = {} } = useQuery({
    queryKey: ["profissional-dados", [...candidatoIds].sort()],
    queryFn: async () => {
      const { data, error } = await supabase.from("profissional_dados").select("*").in("profile_id", candidatoIds);
      if (error) throw error;
      return Object.fromEntries(data.map((d) => [d.profile_id, d]));
    },
    enabled: candidatoIds.length > 0,
  });
  const { data: contratacao } = useQuery({
    queryKey: ["contratacao", "por-vaga", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("contratacoes").select("id, status").eq("job_id", id!).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!job && job.status !== "aberta",
  });

  const aceitar = useAceitarCandidato();
  const recusar = useRecusarCandidato();
  const [confirmando, setConfirmando] = useState<DbApplication | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [cancelando, setCancelando] = useState(false);
  const cancelarVaga = useCancelarVaga();

  if (loadingJob) {
    return <PageSkeleton variante="lista" />;
  }
  if (!job || job.user_id !== user?.id) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="Candidatos" />
        <p className="text-center text-muted-foreground py-16">Vaga não encontrada.</p>
      </div>
    );
  }

  const handleAceitar = async () => {
    if (!confirmando) return;
    const app = confirmando;
    setConfirmando(null);
    setProcessingId(app.id);
    try {
      const nova = await aceitar.mutateAsync({ application: app, job });
      toast.success("Profissional confirmado! Ele(a) foi notificado(a).");
      navigate(`/contratacao/${nova.id}`);
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Erro ao aceitar candidato");
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancelar = async () => {
    try {
      await cancelarVaga.mutateAsync(job.id);
      toast.success("Vaga cancelada. Os candidatos foram avisados.");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Erro ao cancelar a vaga");
    }
  };

  const handleRecusar = async (appId: string) => {
    setProcessingId(appId);
    try {
      await recusar.mutateAsync(appId);
      toast.success("Candidato recusado");
    } catch {
      toast.error("Erro ao recusar");
    } finally {
      setProcessingId(null);
    }
  };

  // Mesmo status: quem tem selo (Indicado > Verificado/Destaque > Top) primeiro, depois nota e trabalhos
  const relev = (userId: string) => (perfis[userId] ? relevanciaPerfil(perfis[userId], trabalhos[userId]) : 0);
  const ordenadas = [...applications].sort((a, b) => {
    const ordem = { aceita: 0, pendente: 1, recusada: 2 } as Record<string, number>;
    return (ordem[a.status] ?? 3) - (ordem[b.status] ?? 3)
      || relev(b.user_id) - relev(a.user_id)
      || Number(perfis[b.user_id]?.avaliacao_media ?? 0) - Number(perfis[a.user_id]?.avaliacao_media ?? 0)
      || (trabalhos[b.user_id] ?? 0) - (trabalhos[a.user_id] ?? 0);
  });

  return (
    <div className="min-h-screen bg-background pb-8 max-w-2xl mx-auto">
      <PageHeader title="Candidatos" />

      <div className="px-5 mb-6">
        <div className="bg-card rounded-3xl p-4 border border-border/70 shadow-card">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="font-display font-bold text-foreground truncate">{job.title}</h2>
              <p className="text-xs text-muted-foreground">{formatDate(job.date)} · {job.time_start}–{job.time_end}</p>
            </div>
            <StatusBadge status={job.status} />
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="font-display font-bold text-primary">{formatBRL(job.payment)}</p>
            {job.status === "aberta" && (
              <button onClick={() => setCancelando(true)} className="text-xs font-semibold text-destructive flex items-center gap-1">
                <XCircle className="h-3.5 w-3.5" /> Cancelar vaga
              </button>
            )}
          </div>
          {contratacao && (
            <button onClick={() => navigate(`/contratacao/${contratacao.id}`)}
              className="mt-3 w-full flex items-center justify-between text-sm text-primary font-medium">
              Ver contratação <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
        {job.status === "aberta" && applications.some((a) => a.status === "pendente") && (
          <p className="text-xs text-muted-foreground mt-3">
            Ao aceitar um candidato, a vaga é marcada como preenchida e os demais candidatos são recusados.
          </p>
        )}
      </div>

      <div className="px-5 space-y-4">
        {isLoading && <p className="text-muted-foreground text-center py-8">Carregando...</p>}
        {!isLoading && applications.length === 0 && (
          <EmptyState icon={Users} titulo="Nenhum candidato ainda"
            descricao="Você receberá uma notificação assim que alguém se candidatar." />
        )}
        {ordenadas.map((app) => {
          const perfil = perfis[app.user_id];
          const dados = dadosProfissionais[app.user_id];
          const podeDecidir = app.status === "pendente" && job.status === "aberta";
          return (
            <CandidateCard
              key={app.id}
              application={app}
              perfil={perfil}
              dados={dados}
              trabalhos={trabalhos[app.user_id]}
              podeDecidir={podeDecidir}
              processando={processingId === app.id ? (aceitar.isPending ? "aceitar" : "recusar") : null}
              bloqueado={processingId !== null}
              onVerPerfil={() => navigate(`/perfil/${app.user_id}?vaga=${job.id}&candidatura=${app.id}`)}
              onAceitar={() => setConfirmando(app)}
              onRecusar={() => handleRecusar(app.id)}
            />
          );
        })}
      </div>

      <AlertDialog open={cancelando} onOpenChange={setCancelando}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar esta vaga?</AlertDialogTitle>
            <AlertDialogDescription>
              A vaga sai do feed e {applications.filter((a) => a.status === "pendente").length || "os"} candidato(s) pendente(s) serão avisados do cancelamento. Não dá para desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Manter vaga</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelar} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Cancelar vaga
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!confirmando} onOpenChange={(open) => !open && setConfirmando(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar {perfis[confirmando?.user_id ?? ""]?.nome || "este profissional"}?</AlertDialogTitle>
            <AlertDialogDescription>
              O profissional será notificado, a vaga ficará preenchida e os outros candidatos serão recusados.
              Valor combinado: {formatBRL(job.payment)}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleAceitar}>Aceitar candidato</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default JobCandidates;
