import { useNavigate } from "react-router-dom";
import { ChevronRight, Briefcase, Star } from "lucide-react";
import { useMyApplications } from "@/hooks/useJobs";
import { useMinhasContratacoes, useAvaliacoesFeitas, formatBRL, formatDate } from "@/hooks/useFrela";
import NotificationBell from "@/components/frela/NotificationBell";
import StatusBadge from "@/components/frela/StatusBadge";
import EmptyState from "@/components/frela/EmptyState";
import { JobListSkeleton } from "@/components/frela/JobCardSkeleton";

/** Aba "Trabalhos" do profissional: contratações + candidaturas. */
const MyWorkTab = () => {
  const navigate = useNavigate();
  const { data: applications = [], isLoading: loadingApps } = useMyApplications();
  const { data: contratacoes = [], isLoading: loadingContratacoes } = useMinhasContratacoes();
  const { data: avaliadas = [] } = useAvaliacoesFeitas();

  const ativas = contratacoes.filter((c) => c.status === "em_andamento");
  const finalizadas = contratacoes.filter((c) => c.status === "finalizada");
  const aAvaliar = finalizadas.filter((c) => !avaliadas.includes(c.id));
  const pendentes = applications.filter((a) => a.status === "pendente");
  const outras = applications.filter((a) => a.status !== "pendente");

  const renderContratacao = (c: (typeof contratacoes)[number]) => (
    <button
      key={c.id}
      onClick={() => navigate(`/contratacao/${c.id}`)}
      className="w-full text-left bg-card rounded-2xl p-4 border border-border shadow-card flex items-center gap-3"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h3 className="font-display font-bold text-foreground truncate">{c.jobs?.title ?? "Vaga"}</h3>
          {aAvaliar.some((x) => x.id === c.id) ? (
            <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-100 text-amber-800">
              <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> Avaliar
            </span>
          ) : (
            <StatusBadge status={c.status} />
          )}
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
      className="w-full text-left bg-card rounded-2xl p-4 border border-border shadow-card"
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
    <div className="pb-24 pt-10 px-5">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-foreground">Meus trabalhos</h1>
        <NotificationBell />
      </div>

      {loading ? (
        <JobListSkeleton n={2} />
      ) : vazio ? (
        <EmptyState icon={Briefcase} titulo="Nenhum trabalho por aqui ainda"
          descricao="Quando você se candidatar a uma vaga, ela aparece aqui com o status." />
      ) : (
        <div className="space-y-8">
          {aAvaliar.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex gap-3 items-center">
              <Star className="h-6 w-6 fill-amber-400 text-amber-400 shrink-0" />
              <p className="text-sm text-amber-900">
                Você tem <b>{aAvaliar.length}</b> trabalho{aAvaliar.length === 1 ? "" : "s"} para avaliar. Sua avaliação ajuda outros profissionais a escolher bons lugares.
              </p>
            </div>
          )}
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
