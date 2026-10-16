import { useNavigate } from "react-router-dom";
import { Loader2, ChevronRight, Briefcase } from "lucide-react";
import { useMyApplications } from "@/hooks/useJobs";
import { useMinhasContratacoes, formatBRL, formatDate } from "@/hooks/useFrela";
import NotificationBell from "@/components/frela/NotificationBell";
import StatusBadge from "@/components/frela/StatusBadge";

/** Aba "Trabalhos" do profissional: contratações + candidaturas. */
const MyWorkTab = () => {
  const navigate = useNavigate();
  const { data: applications = [], isLoading: loadingApps } = useMyApplications();
  const { data: contratacoes = [], isLoading: loadingContratacoes } = useMinhasContratacoes();

  const ativas = contratacoes.filter((c) => c.status === "em_andamento");
  const finalizadas = contratacoes.filter((c) => c.status === "finalizada");
  const pendentes = applications.filter((a) => a.status === "pendente");
  const outras = applications.filter((a) => a.status !== "pendente");

  const renderContratacao = (c: (typeof contratacoes)[number]) => (
    <button
      key={c.id}
      onClick={() => navigate(`/contratacao/${c.id}`)}
      className="w-full text-left bg-card rounded-xl p-4 border border-border shadow-sm flex items-center gap-3"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h3 className="font-display font-bold text-foreground truncate">{c.jobs?.title ?? "Vaga"}</h3>
          <StatusBadge status={c.status} />
        </div>
        <p className="text-sm text-muted-foreground truncate">{c.jobs?.company_name}</p>
        <div className="flex items-center justify-between mt-2 text-sm">
          <span className="font-display font-bold text-primary">{formatBRL(c.valor)}</span>
          {c.jobs && (
            <span className="text-xs text-muted-foreground">
              {formatDate(c.jobs.date)} · {c.jobs.time_start}–{c.jobs.time_end}
            </span>
          )}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </button>
  );

  const renderApplication = (a: (typeof applications)[number]) => (
    <button
      key={a.id}
      onClick={() => navigate(`/job/${a.job_id}`)}
      className="w-full text-left bg-card rounded-xl p-4 border border-border shadow-sm"
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <h3 className="font-display font-bold text-foreground truncate">{a.jobs?.title ?? "Vaga"}</h3>
        <StatusBadge status={a.status} />
      </div>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span className="truncate">{a.jobs?.company_name}</span>
        {a.jobs && <span className="text-xs shrink-0 ml-2">{formatDate(a.jobs.date)}</span>}
      </div>
    </button>
  );

  const loading = loadingApps || loadingContratacoes;
  const vazio = applications.length === 0 && contratacoes.length === 0;

  return (
    <div className="pb-20 pt-12 px-5">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-foreground">Meus trabalhos</h1>
        <NotificationBell />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : vazio ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center mb-4">
            <Briefcase className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">Você ainda não se candidatou a nenhuma vaga</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Encontre vagas na aba Início</p>
        </div>
      ) : (
        <div className="space-y-8">
          {ativas.length > 0 && (
            <section>
              <h2 className="font-display font-bold text-foreground mb-3">Contratações ativas</h2>
              <div className="space-y-3">{ativas.map(renderContratacao)}</div>
            </section>
          )}
          {pendentes.length > 0 && (
            <section>
              <h2 className="font-display font-bold text-foreground mb-3">Candidaturas aguardando resposta</h2>
              <div className="space-y-3">{pendentes.map(renderApplication)}</div>
            </section>
          )}
          {finalizadas.length > 0 && (
            <section>
              <h2 className="font-display font-bold text-foreground mb-3">Trabalhos finalizados</h2>
              <div className="space-y-3">{finalizadas.map(renderContratacao)}</div>
            </section>
          )}
          {outras.length > 0 && (
            <section>
              <h2 className="font-display font-bold text-foreground mb-3">Histórico de candidaturas</h2>
              <div className="space-y-3">{outras.map(renderApplication)}</div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default MyWorkTab;
