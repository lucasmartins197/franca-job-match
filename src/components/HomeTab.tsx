import { useState } from "react";
import { BadgeCheck, ChevronRight, LocateFixed, Map, MapPin, Search, SearchX, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRecomendadasEmpresas } from "@/hooks/useRecomendacoes";
import { Input } from "@/components/ui/input";
import JobCard from "@/components/JobCard";
import CategoryGrid from "@/components/CategoryGrid";
import NotificationBell from "@/components/frela/NotificationBell";
import EmptyState from "@/components/frela/EmptyState";
import { JobListSkeleton } from "@/components/frela/JobCardSkeleton";
import UserAvatar from "@/components/frela/UserAvatar";
import PullToRefresh from "@/components/frela/PullToRefresh";
import PendenciasAviso from "@/components/confirmacao/PendenciasAviso";
import AtalhosFiltro from "@/components/vagas/AtalhosFiltro";
import FiltrosSheet from "@/components/vagas/FiltrosSheet";
import ListaVagas from "@/components/vagas/ListaVagas";
import { CATEGORIAS, categoriaDe } from "@/lib/categorias";
import { contarFiltros } from "@/lib/filtrosVagas";
import { useMeuPerfil } from "@/hooks/usePerfil";
import { useFiltrosVagas, useVagasFiltradas } from "@/hooks/useVagas";

const saudacao = () => {
  const h = new Date().getHours();
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
};

/** Início do profissional: busca, filtros rápidos, categorias, vagas perto e feed. */
const HomeTab = () => {
  const navigate = useNavigate();
  const { data: perfil } = useMeuPerfil();
  const { filtros, setFiltros, limpar } = useFiltrosVagas();
  const { vagas, lista, empresas, isLoading, refetch, localizacao: loc } = useVagasFiltradas();
  const { data: lugares = [], refetch: refetchLugares } = useRecomendadasEmpresas(8);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);

  const profile = perfil?.profile;
  const nome = profile?.nome || "Usuário";
  const semFiltro = !filtros.q && contarFiltros(filtros) === 0;
  const pertinho = loc.real ? [...vagas].filter((v) => v.distanciaKm != null).sort((a, b) => a.distanciaKm! - b.distanciaKm!).slice(0, 6) : [];
  const contagem: Record<string, number> = {};
  for (const v of vagas) {
    const id = categoriaDe(v.job.category)?.id;
    if (id) contagem[id] = (contagem[id] ?? 0) + 1;
  }
  const nomeCategoria = CATEGORIAS.find((c) => c.id === filtros.categoria)?.nome;
  const tituloFeed = nomeCategoria ?? (semFiltro ? (loc.real ? "Vagas perto de você" : "Vagas abertas") : "Resultados");

  return (
    <PullToRefresh onRefresh={() => Promise.all([refetch(), refetchLugares()])}>
      <div className="pb-24">
        <header className="px-5 pt-10 pb-4 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent">
          <div className="flex items-center gap-3 mb-4">
            <UserAvatar nome={nome} fotoUrl={profile?.foto_url} size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">{saudacao()},</p>
              <h1 className="text-xl font-display font-bold text-foreground truncate">{nome.split(" ")[0]} 👋</h1>
            </div>
            <NotificationBell />
          </div>
          <PendenciasAviso className="mb-4" />
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar vaga, empresa ou bairro"
              value={filtros.q}
              onChange={(e) => setFiltros((f) => ({ ...f, q: e.target.value }))}
              className="pl-11 h-12 rounded-2xl bg-card border-border/70 shadow-card text-[15px]"
              aria-label="Buscar vagas"
            />
          </div>
          <button onClick={loc.real ? undefined : loc.pedir}
            className="mt-2.5 text-xs text-muted-foreground inline-flex items-center gap-1.5">
            {loc.real ? <MapPin className="h-3.5 w-3.5 text-primary" /> : <LocateFixed className="h-3.5 w-3.5 text-primary" />}
            {loc.real ? "Mostrando vagas perto de você" : loc.status === "pedindo" ? "Buscando sua localização..." : <>Franca, SP · <span className="font-semibold text-primary">usar minha localização</span></>}
          </button>
          <AtalhosFiltro onAbrirFiltros={() => setFiltrosAbertos(true)} className="mt-3" />
        </header>

        <div className="px-5 space-y-6">
          {semFiltro && (
            <section>
              <h2 className="font-display font-bold text-lg text-foreground mb-3">O que você procura?</h2>
              <CategoryGrid onSelect={(id) => setFiltros((f) => ({ ...f, categoria: id }))} selected={filtros.categoria} contagem={contagem} />
            </section>
          )}

          {semFiltro && pertinho.length > 1 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display font-bold text-lg text-foreground">Pertinho de você</h2>
                <button onClick={() => navigate("/?tab=search&vista=mapa")} className="text-sm font-semibold text-primary flex items-center gap-1 shrink-0">
                  <Map className="h-4 w-4" /> Ver no mapa
                </button>
              </div>
              <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5 pb-2 snap-x snap-mandatory scroll-px-5">
                {pertinho.map((v, i) => (
                  <div key={v.job.id} className="shrink-0 w-[84%] max-w-[320px] snap-start">
                    <JobCard job={v.job} index={i} empresa={empresas[v.job.user_id]} distanciaKm={v.distanciaKm} compacto />
                  </div>
                ))}
              </div>
            </section>
          )}

          {semFiltro && lugares.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display font-bold text-lg text-foreground">Melhores lugares para trabalhar</h2>
                <button onClick={() => navigate("/melhores-lugares")} className="text-sm font-semibold text-primary flex items-center shrink-0">Ver todos <ChevronRight className="h-4 w-4" /></button>
              </div>
              <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5 pb-2">
                {lugares.slice(0, 8).map((e) => (
                  <button key={e.id} onClick={() => navigate(`/perfil/${e.id}`)}
                    className="shrink-0 w-40 text-left bg-card border border-border/70 rounded-3xl p-3.5 shadow-card hover:shadow-lg active:scale-[0.98] transition-all">
                    <UserAvatar nome={e.nome_empresa} fotoUrl={e.foto_url} size="md" />
                    <p className="font-semibold text-sm text-foreground mt-2.5 truncate flex items-center gap-1">
                      <span className="truncate">{e.nome_empresa}</span>
                      {e.verificado && <BadgeCheck className="h-3.5 w-3.5 text-primary shrink-0" />}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {e.total_avaliacoes ? Number(e.avaliacao_media).toFixed(1) : "—"} · {e.contratacoes} contrat.
                    </p>
                    {e.vagas_abertas > 0 && (
                      <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
                        {e.vagas_abertas} vaga{e.vagas_abertas === 1 ? "" : "s"} aberta{e.vagas_abertas === 1 ? "" : "s"}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </section>
          )}

          <section>
            <div className="flex items-end justify-between mb-3 gap-3">
              <div className="min-w-0">
                <h2 className="font-display font-bold text-lg text-foreground truncate">{tituloFeed}</h2>
                {!isLoading && <p className="text-xs text-muted-foreground">{lista.length} vaga{lista.length === 1 ? "" : "s"}</p>}
              </div>
              <button onClick={() => navigate("/?tab=search&vista=mapa")}
                className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-card border border-border text-sm font-semibold text-foreground shadow-card">
                <Map className="h-4 w-4 text-primary" /> Mapa
              </button>
            </div>

            {isLoading ? (
              <JobListSkeleton />
            ) : lista.length === 0 ? (
              vagas.length === 0 ? (
                <EmptyState icon={Search} titulo="Nenhuma vaga aberta agora"
                  descricao="Novas vagas aparecem aqui assim que as empresas publicarem — e avisamos você nos seus dias disponíveis." />
              ) : (
                <EmptyState icon={SearchX} titulo="Nada com esses filtros" descricao="Tente aumentar a distância ou escolher outro dia."
                  acao={<button onClick={limpar} className="text-sm font-semibold text-primary">Limpar filtros</button>} />
              )
            ) : (
              <ListaVagas vagas={lista} empresas={empresas} chave={JSON.stringify(filtros)} mostrarDistancia={loc.real} />
            )}
          </section>
        </div>
      </div>
      <FiltrosSheet aberto={filtrosAbertos} onFechar={() => setFiltrosAbertos(false)} />
    </PullToRefresh>
  );
};

export default HomeTab;
