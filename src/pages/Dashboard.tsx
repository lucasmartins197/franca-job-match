import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, LogOut, Users, Briefcase, Lock, Star, ChevronRight, Clock, MessageCircle, Crown, Receipt } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMyJobs } from "@/hooks/useJobs";
import {
  useMinhasContratacoes, useProfilesByIds, useAvaliacoesFeitas, useTravaNovaVaga, formatBRL, formatDate,
} from "@/hooks/useFrela";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PostJobTab from "@/components/PostJobTab";
import NotificationBell from "@/components/frela/NotificationBell";
import StatusBadge from "@/components/frela/StatusBadge";
import UserAvatar from "@/components/frela/UserAvatar";
import EmptyState from "@/components/frela/EmptyState";
import { JobListSkeleton } from "@/components/frela/JobCardSkeleton";
import { useMeuPerfil } from "@/hooks/usePerfil";
import { useChatNaoLidas } from "@/hooks/useChat";
import { PLANOS } from "@/lib/pagamentos";
import { useResumoTaxas } from "@/hooks/useTaxas";
import TaxasAviso from "@/components/taxas/TaxasAviso";
import { Progress } from "@/components/ui/progress";
import FinalizarContratacaoButton from "@/components/frela/FinalizarContratacaoButton";

const STATUS_TABS = [
  { value: "aberta", label: "Abertas" },
  { value: "preenchida", label: "Preenchidas" },
  { value: "finalizada", label: "Finalizadas" },
  { value: "cancelada", label: "Canceladas" },
];

/** Painel da empresa. */
const Dashboard = () => {
  const { user, signOut, userTipo } = useAuth();
  const navigate = useNavigate();
  const { data: perfil } = useMeuPerfil();
  const { data: myJobs = [], isLoading } = useMyJobs();
  const { data: contratacoes = [] } = useMinhasContratacoes();
  const { bloqueado, motivo, pendentes } = useTravaNovaVaga();
  const { resumo: taxas } = useResumoTaxas();
  const [showPostModal, setShowPostModal] = useState(false);
  const chatNaoLidas = useChatNaoLidas();

  const jobIds = myJobs.map((j) => j.id);
  const { data: candidaturas = [] } = useQuery({
    queryKey: ["job-applications", "empresa", jobIds],
    queryFn: async () => {
      const { data, error } = await supabase.from("applications").select("job_id, status").in("job_id", jobIds);
      if (error) throw error;
      return data;
    },
    enabled: jobIds.length > 0,
  });

  const { data: minhasAvaliacoes = [] } = useAvaliacoesFeitas();


  const { data: profissionais = {} } = useProfilesByIds(contratacoes.map((c) => c.profissional_id));

  if (userTipo === "freelancer") return <Navigate to="/" replace />;

  const empresaNome = perfil?.empresa?.nome_empresa || perfil?.profile.nome || user?.user_metadata?.nome || "Empresa";
  const abertas = myJobs.filter((j) => j.status === "aberta");
  const aAvaliar = contratacoes.filter((c) => c.status === "finalizada" && !minhasAvaliacoes.includes(c.id));
  const pendentesPorVaga = (jobId: string) => candidaturas.filter((a) => a.job_id === jobId && a.status === "pendente").length;

  const abrirNovaVaga = () => {
    if (bloqueado) {
      toast.error(motivo === "taxas" ? "Quite as taxas em aberto para criar novas vagas." : "Confirme a finalização da contratação em andamento antes de criar uma nova vaga.");
      return;
    }
    setShowPostModal(true);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background pb-28 max-w-2xl mx-auto">
      <div className="px-5 pt-10 pb-6 flex items-center justify-between gap-3 bg-gradient-to-b from-primary/10 to-transparent">
        <button onClick={() => navigate("/profile")} className="flex items-center gap-3 min-w-0 text-left" aria-label="Meu perfil">
          <UserAvatar nome={empresaNome} fotoUrl={perfil?.profile.foto_url} size="md" />
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs">Painel da empresa</p>
            <h1 className="text-xl font-display font-bold text-foreground truncate">{empresaNome}</h1>
          </div>
        </button>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => navigate("/chat")} aria-label={chatNaoLidas > 0 ? `Conversas (${chatNaoLidas} não lidas)` : "Conversas"}
            className="relative w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center shadow-card">
            <MessageCircle className="h-5 w-5 text-muted-foreground" />
            {chatNaoLidas > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center">
                {chatNaoLidas > 9 ? "9+" : chatNaoLidas}
              </span>
            )}
          </button>
          <NotificationBell />
          <button onClick={handleSignOut} aria-label="Sair"
            className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center shadow-card">
            <LogOut className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <TaxasAviso className="mx-5 mb-4 w-[calc(100%-2.5rem)]" />

      {motivo === "contratacao" && (
        <div className="mx-5 mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 flex gap-3">
          <Lock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900">
            <p className="font-bold mb-0.5">Criação de vagas bloqueada</p>
            <p>
              Você tem {pendentes.length === 1 ? "uma contratação" : `${pendentes.length} contratações`} em andamento.
              Depois que o serviço acontecer, clique em <b>Confirmar finalização</b> para liberar novas vagas.
            </p>
          </div>
        </div>
      )}

      <div className="px-5 grid grid-cols-3 gap-3 mb-8">
        {[
          { label: "Vagas abertas", value: abertas.length, icon: Briefcase },
          { label: "Em andamento", value: pendentes.length, icon: Clock },
          { label: "Candidatos novos", value: candidaturas.filter((a) => a.status === "pendente").length, icon: Users },
        ].map((m) => (
          <div key={m.label} className="bg-card rounded-2xl p-3 border border-border text-center shadow-card">
            <m.icon className="h-5 w-5 text-primary mx-auto mb-2" />
            <div className="text-xl font-display font-bold text-foreground">{m.value}</div>
            <div className="text-[10px] text-muted-foreground">{m.label}</div>
          </div>
        ))}
      </div>

      <button onClick={() => navigate("/taxas")}
        className="mx-5 mb-3 w-[calc(100%-2.5rem)] rounded-2xl border border-border bg-card p-4 text-left shadow-card">
        <div className="flex items-center gap-3">
          <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${taxas.bloqueado ? "bg-destructive/10 text-destructive" : "bg-amber-100 text-amber-800"}`}>
            <Receipt className="h-5 w-5" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-semibold text-foreground">Minhas taxas</span>
            <span className="block text-xs text-muted-foreground">
              Saldo {formatBRL(taxas.saldo)} de {formatBRL(taxas.teto)}
              {taxas.em_divergencia > 0 ? ` · ${formatBRL(taxas.em_divergencia)} em análise` : ""}
            </span>
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
        <Progress value={Math.min(100, (taxas.saldo / taxas.teto) * 100)}
          className={`h-1.5 mt-3 ${taxas.bloqueado ? "[&>div]:bg-destructive" : taxas.perto ? "[&>div]:bg-amber-500" : ""}`} />
      </button>

      <button onClick={() => navigate("/planos")}
        className="mx-5 mb-8 w-[calc(100%-2.5rem)] flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-3.5 text-left">
        <span className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0"><Crown className="h-5 w-5" /></span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-semibold text-foreground">FreLa Empresa · {formatBRL(PLANOS.empresa.preco)}/mês</span>
          <span className="block text-xs text-muted-foreground">Lançamento gratuito em Franca · ver plano e taxa</span>
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>

      {pendentes.length > 0 && (
        <section className="px-5 mb-8">
          <h2 className="font-display font-bold text-foreground mb-3">Contratações em andamento</h2>
          <div className="space-y-3">
            {pendentes.map((c) => (
              <div key={c.id} className="bg-card rounded-2xl p-4 border border-primary/30 shadow-card">
                <button onClick={() => navigate(`/contratacao/${c.id}`)} className="w-full text-left">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="font-display font-bold text-foreground truncate">{c.jobs?.title}</h3>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Profissional: <span className="text-foreground font-medium">{profissionais[c.profissional_id]?.nome || "—"}</span>
                  </p>
                  <div className="flex items-center justify-between mt-1 text-sm">
                    <span className="font-display font-bold text-primary">{formatBRL(c.valor)}</span>
                    {c.jobs && <span className="text-xs text-muted-foreground">{formatDate(c.jobs.date)} · {c.jobs.time_start}–{c.jobs.time_end}</span>}
                  </div>
                </button>
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" onClick={() => navigate(`/chat/${c.id}`)} className="h-11 rounded-xl" aria-label="Abrir chat">
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                  <FinalizarContratacaoButton contratacao={c} className="flex-1 h-11" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {aAvaliar.length > 0 && (
        <section className="px-5 mb-8">
          <h2 className="font-display font-bold text-foreground mb-3">Avalie quem trabalhou com você</h2>
          <div className="space-y-3">
            {aAvaliar.map((c) => (
              <button key={c.id} onClick={() => navigate(`/contratacao/${c.id}`)}
                className="w-full text-left bg-card rounded-xl p-4 border border-amber-200 shadow-card flex items-center gap-3">
                <Star className="h-5 w-5 fill-amber-400 text-amber-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-foreground truncate">{profissionais[c.profissional_id]?.nome || "Profissional"}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.jobs?.title}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="px-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-foreground">Minhas vagas</h2>
          <Button size="sm" onClick={abrirNovaVaga} disabled={bloqueado}
            className="rounded-lg text-primary-foreground font-semibold disabled:opacity-50">
            {bloqueado ? <Lock className="h-3.5 w-3.5 mr-1" /> : <Plus className="h-3.5 w-3.5 mr-1" />} Criar vaga
          </Button>
        </div>
        {isLoading ? (
          <JobListSkeleton n={2} />
        ) : myJobs.length === 0 ? (
          <EmptyState icon={Briefcase} titulo="Nenhuma vaga publicada ainda"
            descricao="Publique sua primeira vaga e receba candidatos de Franca em poucas horas."
            acao={<Button onClick={abrirNovaVaga} disabled={bloqueado} className="text-primary-foreground rounded-xl font-semibold">
              <Plus className="h-4 w-4 mr-2" /> Publicar primeira vaga
            </Button>} />
        ) : (
          <Tabs defaultValue="aberta">
            <TabsList className="w-full justify-start overflow-x-auto no-scrollbar mb-3 h-auto p-1">
              {STATUS_TABS.map((t) => {
                const n = myJobs.filter((j) => j.status === t.value).length;
                return (
                  <TabsTrigger key={t.value} value={t.value} className="text-xs shrink-0 gap-1.5">
                    {t.label}
                    <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-muted-foreground/15 text-[10px] font-semibold flex items-center justify-center">{n}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
            {STATUS_TABS.map((t) => {
              const lista = myJobs.filter((j) => j.status === t.value);
              return (
                <TabsContent key={t.value} value={t.value} className="space-y-3">
                  {lista.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">Nenhuma vaga aqui</p>}
                  {lista.map((job) => {
                    const novos = pendentesPorVaga(job.id);
                    return (
                      <div key={job.id} className="bg-card rounded-2xl p-4 border border-border shadow-card">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="min-w-0">
                            <h3 className="font-display font-bold text-foreground truncate">{job.title}</h3>
                            <span className="text-xs text-muted-foreground">{formatDate(job.date)} · {job.time_start}–{job.time_end}</span>
                          </div>
                          <StatusBadge status={job.status} />
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <span className="font-display font-bold text-primary">{formatBRL(job.payment)}</span>
                          <Button size="sm" variant="outline" onClick={() => navigate(`/job/${job.id}/candidates`)}
                            className="h-8 rounded-lg border-border text-muted-foreground hover:text-foreground text-xs">
                            <Users className="h-3.5 w-3.5 mr-1" /> Candidatos
                            {novos > 0 && <span className="ml-1.5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px]">{novos}</span>}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </TabsContent>
              );
            })}
          </Tabs>
        )}
      </section>

      {!bloqueado && (
        <button onClick={abrirNovaVaga} aria-label="Criar vaga"
          className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl flex items-center justify-center z-50 bg-primary shadow-brand">
          <Plus className="h-6 w-6 text-primary-foreground" />
        </button>
      )}

      <Dialog open={showPostModal} onOpenChange={setShowPostModal}>
        <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-foreground">Nova vaga</DialogTitle>
          </DialogHeader>
          <PostJobTab onClose={() => setShowPostModal(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
