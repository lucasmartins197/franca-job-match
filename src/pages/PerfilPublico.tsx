import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Check, Headset, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMeuPerfil, useInvalidatePerfil, usePerfilPublico } from "@/hooks/usePerfil";
import { useJob, useJobApplications } from "@/hooks/useJobs";
import { useAceitarCandidato, useMinhasContratacoes, useRecusarCandidato, formatBRL } from "@/hooks/useFrela";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import PageHeader from "@/components/frela/PageHeader";
import ProfileView from "@/components/perfil/ProfileView";
import JobCard from "@/components/JobCard";
import EmptyState from "@/components/frela/EmptyState";

/**
 * Perfil de qualquer usuário. Vindo da lista de candidatos (?vaga=&candidatura=),
 * a empresa dona da vaga pode aceitar/recusar direto daqui.
 */
const PerfilPublico = () => {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: perfil, isLoading } = usePerfilPublico(id);
  const { data: contratacoes = [] } = useMinhasContratacoes();

  const vagaId = params.get("vaga") ?? undefined;
  const candidaturaId = params.get("candidatura");
  const { data: job } = useJob(vagaId);
  const { data: applications = [] } = useJobApplications(vagaId);
  const candidatura = applications.find((a) => a.id === candidaturaId && a.user_id === id);
  const aceitar = useAceitarCandidato();
  const recusar = useRecusarCandidato();
  const [confirmando, setConfirmando] = useState(false);
  const { data: meuPerfil } = useMeuPerfil();
  const souAdmin = !!meuPerfil?.profile.is_admin;
  const invalidatePerfil = useInvalidatePerfil();
  const [alterandoSelo, setAlterandoSelo] = useState(false);

  const alternarVerificado = async () => {
    if (!perfil) return;
    setAlterandoSelo(true);
    const { error } = await supabase.rpc("admin_set_verificado", { p_id: perfil.profile.id, p_valor: !perfil.profile.verificado });
    setAlterandoSelo(false);
    if (error) toast.error("Não foi possível alterar o selo");
    else {
      toast.success(perfil.profile.verificado ? "Selo removido" : "Perfil verificado!");
      await invalidatePerfil();
    }
  };

  const isEmpresa = perfil?.profile.tipo === "empresa";
  const { data: vagasAbertas = [] } = useQuery({
    queryKey: ["jobs", "empresa", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("jobs").select("*").eq("user_id", id!).eq("status", "aberta").order("date");
      if (error) throw error;
      return data;
    },
    enabled: !!id && isEmpresa,
  });

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }
  if (!perfil) {
    return (
      <div className="min-h-screen bg-background max-w-lg mx-auto">
        <PageHeader title="Perfil" />
        <EmptyState titulo="Perfil não encontrado" />
      </div>
    );
  }

  const souEu = user?.id === id;
  const temContratacao = contratacoes.some((c) => c.empresa_id === id || c.profissional_id === id);
  const podeDecidir = !!candidatura && !!job && job.user_id === user?.id && job.status === "aberta" && candidatura.status === "pendente";

  const handleAceitar = async () => {
    if (!candidatura || !job) return;
    setConfirmando(false);
    try {
      const nova = await aceitar.mutateAsync({ application: candidatura, job });
      toast.success("Profissional confirmado! Ele(a) foi notificado(a).");
      navigate(`/contratacao/${nova.id}`, { replace: true });
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Erro ao aceitar candidato");
    }
  };

  const handleRecusar = async () => {
    if (!candidatura) return;
    try {
      await recusar.mutateAsync(candidatura.id);
      toast.success("Candidato recusado");
      navigate(-1);
    } catch {
      toast.error("Erro ao recusar");
    }
  };

  return (
    <div className={`min-h-screen bg-background max-w-lg mx-auto ${podeDecidir ? "pb-32" : "pb-12"}`}>
      <PageHeader title={souEu ? "Meu perfil" : isEmpresa ? "Perfil da empresa" : "Perfil do profissional"} />
      <div className="px-5">
        <ProfileView perfil={perfil} mostrarContato={souEu || temContratacao}>
          {isEmpresa && (
            <section>
              <h3 className="font-display font-bold text-foreground mb-2 px-1">Vagas abertas</h3>
              {vagasAbertas.length === 0 ? (
                <p className="text-sm text-muted-foreground px-1">Nenhuma vaga aberta agora.</p>
              ) : (
                <div className="space-y-3">{vagasAbertas.map((j, i) => <JobCard key={j.id} job={j} index={i} />)}</div>
              )}
            </section>
          )}
        </ProfileView>

        {souAdmin && !souEu && (
          <section className="mt-4 rounded-2xl border border-dashed border-primary/40 p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Ações de administrador</p>
            <Button variant="outline" onClick={alternarVerificado} disabled={alterandoSelo} className="w-full h-11 rounded-xl">
              {alterandoSelo ? <Loader2 className="h-4 w-4 animate-spin" /> : <><BadgeCheck className="h-4 w-4 mr-2" /> {perfil.profile.verificado ? "Remover selo Verificado" : "Marcar como Verificado"}</>}
            </Button>
            <Button variant="outline" onClick={() => navigate(`/admin/suporte/${perfil.profile.id}`)} className="w-full h-11 rounded-xl">
              <Headset className="h-4 w-4 mr-2" /> Mensagem de suporte para este usuário
            </Button>
          </section>
        )}
      </div>

      {podeDecidir && (
        <div className="fixed bottom-0 inset-x-0 bg-background/95 backdrop-blur border-t border-border p-4">
          <div className="max-w-lg mx-auto">
            <p className="text-xs text-muted-foreground mb-2 truncate">Candidato(a) à vaga <b className="text-foreground">{job!.title}</b> · {formatBRL(job!.payment)}</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleRecusar} disabled={recusar.isPending || aceitar.isPending}
                className="h-12 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10">
                {recusar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><X className="h-4 w-4 mr-1" /> Recusar</>}
              </Button>
              <Button onClick={() => setConfirmando(true)} disabled={aceitar.isPending || recusar.isPending} className="flex-1 h-12 rounded-xl font-semibold">
                {aceitar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 mr-1" /> Aceitar candidato</>}
              </Button>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={confirmando} onOpenChange={setConfirmando}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar {perfil.profile.nome || "este profissional"}?</AlertDialogTitle>
            <AlertDialogDescription>
              O profissional será notificado, a vaga ficará preenchida e os outros candidatos serão recusados.
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

export default PerfilPublico;
