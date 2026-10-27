import { useNavigate } from "react-router-dom";
import { Briefcase, ChevronRight, MapPin, Star, ThumbsUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { selosRecomendado, useRecomendadasEmpresas } from "@/hooks/useRecomendacoes";
import PageHeader from "@/components/frela/PageHeader";
import UserAvatar from "@/components/frela/UserAvatar";
import EmptyState from "@/components/frela/EmptyState";
import Selos from "@/components/perfil/Selos";

/** Para o profissional: empresas mais bem avaliadas e que mais contratam. */
const MelhoresLugares = () => {
  const navigate = useNavigate();
  const { data: lista = [], isLoading } = useRecomendadasEmpresas(100);

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto pb-12">
      <PageHeader title="Melhores lugares para trabalhar" />
      <div className="px-5 space-y-3">
        <p className="text-sm text-muted-foreground">Empresas verificadas e bem avaliadas pelos profissionais aparecem primeiro.</p>
        {isLoading ? (
          [0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
        ) : lista.length === 0 ? (
          <EmptyState icon={ThumbsUp} titulo="Ainda sem empresas avaliadas" />
        ) : (
          lista.map((e, i) => (
            <button key={e.id} onClick={() => navigate(`/perfil/${e.id}`)}
              className="w-full text-left bg-card rounded-3xl border border-border/70 p-4 shadow-card active:scale-[0.985] transition-transform flex gap-3 items-start hover:border-primary/40">
              <div className="relative shrink-0">
                <UserAvatar nome={e.nome_empresa} fotoUrl={e.foto_url} size="lg" />
                <span className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-muted text-muted-foreground text-[11px] font-bold flex items-center justify-center border-2 border-card">{i + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-foreground truncate">{e.nome_empresa}</p>
                <p className="text-xs text-muted-foreground truncate">{[e.ramo, e.cidade].filter(Boolean).join(" · ")}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-1">
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {e.total_avaliacoes ? <><b className="text-foreground">{Number(e.avaliacao_media).toFixed(1)}</b> ({e.total_avaliacoes})</> : "Sem avaliações"}
                  </span>
                  <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {e.contratacoes} contratações</span>
                  {e.vagas_abertas > 0 && <span className="inline-flex items-center gap-1 text-primary font-semibold"><MapPin className="h-3.5 w-3.5" /> {e.vagas_abertas} vaga{e.vagas_abertas === 1 ? "" : "s"} aberta{e.vagas_abertas === 1 ? "" : "s"}</span>}
                </div>
                <Selos selos={selosRecomendado(e, true)} size="sm" className="mt-1.5" />
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 self-center" />
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default MelhoresLugares;
