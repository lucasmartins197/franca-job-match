import { useParams, useNavigate } from "react-router-dom";
import { MapPin, Clock, Calendar, Building2, CheckCircle2, Loader2, Users, ChevronRight, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useJob, useApply, useMyApplications } from "@/hooks/useJobs";
import { useAuth } from "@/hooks/useAuth";
import { formatBRL, useAvaliacoesRecebidas } from "@/hooks/useFrela";
import { textoPendencia, usePendencias } from "@/hooks/useConfirmacao";
import { selosDe, useContratacoesEmpresa, usePerfilPublico } from "@/hooks/usePerfil";
import UserAvatar from "@/components/frela/UserAvatar";
import MapaEndereco from "@/components/frela/MapaEndereco";
import Selos from "@/components/perfil/Selos";
import { categoriaDe } from "@/lib/categorias";
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
  const { data: perfilEmpresa } = usePerfilPublico(job?.user_id);
  const pendencias = usePendencias();
  const { data: contratacoesEmpresa } = useContratacoesEmpresa(job?.user_id);
  const { data: avaliacoesEmpresa = [] } = useAvaliacoesRecebidas(job?.user_id);
  const ultimaAvaliacao = avaliacoesEmpresa.find((a) => a.comentario);

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

  const empresa = perfilEmpresa?.profile;
  const empresaDados = perfilEmpresa?.empresa;
  const cat = categoriaDe(job.category);
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
          className="w-full h-12 rounded-xl text-primary-foreground font-semibold text-base">
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
          <span className={`text-sm font-semibold ${minhaCandidatura.status === "recusada" ? "text-muted-foreground" : "text-success"}`}>{texto}</span>
        </motion.div>
      );
    }
    if (job.status !== "aberta") {
      return <p className="text-center text-muted-foreground h-14 flex items-center justify-center">Esta vaga não está mais aberta</p>;
    }
    if (pendencias.bloqueiaCandidatura && pendencias.principal) {
      const t = textoPendencia(pendencias.principal);
      return (
        <div className="space-y-2">
          <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-2 flex gap-1.5">
            <Lock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span><b>Candidatura bloqueada.</b> {t.descricao}</span>
          </p>
          <Button onClick={() => navigate(`/contratacao/${pendencias.principal!.contratacao_id}`)}
            className="w-full h-12 rounded-xl font-semibold text-base">
            {t.acao}
          </Button>
        </div>
      );
    }
    return (
      <Button onClick={handleApply} disabled={applyMutation.isPending}
        className="w-full h-12 rounded-xl text-primary-foreground font-semibold text-base">
        {applyMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Candidatar-se"}
      </Button>
    );
  };

  const acao = renderAcao();

  return (
    <div className="min-h-screen bg-background pb-40 max-w-lg mx-auto">
      <PageHeader title="Detalhes da vaga" />

      <div className="px-5">
        <section className="bg-card rounded-2xl border border-border shadow-card p-5 mb-5">
          <div className="flex items-start gap-3">
            <UserAvatar nome={empresaDados?.nome_empresa || job.company_name} fotoUrl={empresa?.foto_url} size="lg" />
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-display font-bold text-foreground leading-snug">{job.title}</h2>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <Building2 className="h-3.5 w-3.5" /> {job.company_name}
              </p>
            </div>
            <StatusBadge status={job.status} />
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${cat?.cor ?? "bg-primary/10 text-primary"}`}>
              {cat && <cat.icon className="h-3.5 w-3.5" />} {cat?.nome ?? job.category}
            </span>
            {job.skill && job.skill !== job.category && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-muted text-foreground/80">{job.skill}</span>
            )}
          </div>
          <div className="mt-4 rounded-xl bg-primary/5 border border-primary/15 px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Você recebe</span>
            <span className="text-2xl font-display font-extrabold text-primary">{formatBRL(job.payment)}</span>
          </div>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li className="flex items-center gap-3"><Calendar className="h-4 w-4 text-primary shrink-0" />
              <span className="text-foreground">{new Date(`${job.date}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}</span></li>
            <li className="flex items-center gap-3"><Clock className="h-4 w-4 text-primary shrink-0" />
              <span className="text-foreground">{job.time_start} às {job.time_end}</span></li>
            <li className="flex items-start gap-3"><MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span className="text-foreground">{[job.neighborhood, job.address].filter(Boolean).join(" · ") || "Franca/SP"}</span></li>
          </ul>
        </section>

        <section className="bg-card rounded-2xl border border-border p-5 mb-5">
          <h3 className="font-display font-bold text-foreground mb-2">Sobre a vaga</h3>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{job.description || "Sem descrição fornecida."}</p>
        </section>

        {(job.address || empresaDados?.endereco) && (
          <section className="mb-5">
            <h3 className="font-display font-bold text-foreground mb-2">Local do trabalho</h3>
            <MapaEndereco
              endereco={[job.address || empresaDados?.endereco, job.neighborhood].filter(Boolean).join(" - ")}
              cidade={empresa?.cidade || "Franca"}
              coordenadas={!job.address && empresaDados?.latitude != null && empresaDados?.longitude != null ? { lat: empresaDados.latitude, lon: empresaDados.longitude } : null}
            />
          </section>
        )}

        <h3 className="font-display font-bold text-foreground mb-2">Quem está contratando</h3>
        <section className="bg-card rounded-2xl border border-border mb-6 shadow-card overflow-hidden">
          <button onClick={() => navigate(`/perfil/${job.user_id}`)}
            className="w-full text-left p-4 flex items-center gap-3 hover:bg-muted/40 transition-colors">
            <UserAvatar nome={empresaDados?.nome_empresa || job.company_name} fotoUrl={empresa?.foto_url} size="lg" />
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-foreground truncate">{empresaDados?.nome_empresa || job.company_name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {[empresaDados?.ramo, empresaDados?.endereco || `${empresa?.cidade || "Franca"}, SP`].filter(Boolean).join(" · ")}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <Stars value={Number(empresa?.avaliacao_media ?? 0)} size="sm" />
                <span className="text-xs text-muted-foreground">
                  {empresa?.total_avaliacoes ? `${Number(empresa.avaliacao_media).toFixed(1)} (${empresa.total_avaliacoes})` : "Sem avaliações ainda"}
                </span>
              </div>
              {empresa && <Selos selos={selosDe(empresa).filter((x) => x.tipo !== "novo")} size="sm" className="mt-1.5" />}
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
          </button>
          <div className="px-4 pb-4 space-y-3">
            {empresaDados?.bio && <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{empresaDados.bio}</p>}
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="rounded-xl bg-muted/60 py-2">
                <p className="text-base font-display font-bold text-foreground">{contratacoesEmpresa ?? 0}</p>
                <p className="text-[11px] text-muted-foreground">contratações pelo FreLa</p>
              </div>
              <div className="rounded-xl bg-muted/60 py-2">
                <p className="text-base font-display font-bold text-foreground">{empresa?.total_avaliacoes ? Number(empresa.avaliacao_media).toFixed(1) : "—"}</p>
                <p className="text-[11px] text-muted-foreground">nota dos profissionais</p>
              </div>
            </div>
            {ultimaAvaliacao && (
              <blockquote className="text-sm text-foreground bg-muted/40 rounded-xl p-3">
                <Stars value={ultimaAvaliacao.nota} size="sm" />
                <p className="mt-1">“{ultimaAvaliacao.comentario}”</p>
              </blockquote>
            )}
            <Button variant="outline" onClick={() => navigate(`/perfil/${job.user_id}`)} className="w-full h-11 rounded-xl font-semibold">
              <Building2 className="h-4 w-4 mr-2" /> Ver perfil completo da empresa
            </Button>
          </div>
        </section>
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
