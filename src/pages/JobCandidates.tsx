import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Check, X, Loader2, Phone, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DbApplication, useJob, useJobApplications } from "@/hooks/useJobs";
import {
  useAceitarCandidato, useRecusarCandidato, useProfilesByIds, formatBRL, formatDate,
} from "@/hooks/useFrela";
import PageHeader from "@/components/frela/PageHeader";
import StatusBadge from "@/components/frela/StatusBadge";
import Stars from "@/components/frela/Stars";

const JobCandidates = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: job, isLoading: loadingJob } = useJob(id);
  const { data: applications = [], isLoading } = useJobApplications(id);
  const candidatoIds = applications.map((a) => a.user_id);
  const { data: perfis = {} } = useProfilesByIds(candidatoIds);
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

  if (loadingJob) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
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

  const ordenadas = [...applications].sort((a, b) => {
    const ordem = { aceita: 0, pendente: 1, recusada: 2 } as Record<string, number>;
    return (ordem[a.status] ?? 3) - (ordem[b.status] ?? 3);
  });

  return (
    <div className="min-h-screen bg-background pb-8 max-w-2xl mx-auto">
      <PageHeader title="Candidatos" />

      <div className="px-5 mb-6">
        <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="font-display font-bold text-foreground truncate">{job.title}</h2>
              <p className="text-xs text-muted-foreground">{formatDate(job.date)} · {job.time_start}–{job.time_end}</p>
            </div>
            <StatusBadge status={job.status} />
          </div>
          <p className="font-display font-bold text-primary mt-2">{formatBRL(job.payment)}</p>
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

      <div className="px-5 space-y-3">
        {isLoading && <p className="text-muted-foreground text-center py-8">Carregando...</p>}
        {!isLoading && applications.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Nenhum candidato ainda</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Você receberá uma notificação quando alguém se candidatar.</p>
          </div>
        )}
        {ordenadas.map((app) => {
          const perfil = perfis[app.user_id];
          const dados = dadosProfissionais[app.user_id];
          const nome = perfil?.nome || "Profissional";
          const podeDecidir = app.status === "pendente" && job.status === "aberta";
          return (
            <div key={app.id} className="bg-card rounded-xl p-4 border border-border shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl gradient-brand flex items-center justify-center text-lg font-display font-bold text-primary-foreground shrink-0">
                  {nome.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-display font-bold text-foreground text-sm truncate">{nome}</p>
                    <StatusBadge status={app.status} />
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Stars value={Number(perfil?.avaliacao_media ?? 0)} size="sm" />
                    <span className="text-xs text-muted-foreground">
                      {perfil?.total_avaliacoes ? `${Number(perfil.avaliacao_media).toFixed(1)} (${perfil.total_avaliacoes})` : "Sem avaliações"}
                    </span>
                  </div>
                  {dados?.profissoes && dados.profissoes.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{dados.profissoes.join(" · ")}</p>
                  )}
                </div>
              </div>
              {dados?.bio && <p className="text-sm text-muted-foreground mt-3 line-clamp-3">{dados.bio}</p>}
              {app.status === "aceita" && perfil?.telefone && (
                <a href={`tel:${perfil.telefone}`} className="mt-3 flex items-center gap-2 text-sm text-primary">
                  <Phone className="h-4 w-4" /> {perfil.telefone}
                </a>
              )}
              {podeDecidir && (
                <div className="flex gap-2 mt-4">
                  <Button onClick={() => setConfirmando(app)} disabled={processingId !== null}
                    className="flex-1 h-10 rounded-lg bg-green-600 text-white hover:bg-green-700">
                    {processingId === app.id && aceitar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 mr-1" /> Aceitar</>}
                  </Button>
                  <Button variant="outline" onClick={() => handleRecusar(app.id)} disabled={processingId !== null}
                    className="h-10 rounded-lg border-destructive/30 text-destructive hover:bg-destructive/10">
                    {processingId === app.id && recusar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><X className="h-4 w-4 mr-1" /> Recusar</>}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

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
