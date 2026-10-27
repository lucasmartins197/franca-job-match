import { useState } from "react";
import { List, Map as MapIcon, Search, SearchX, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import MapaVagas from "@/components/vagas/MapaVagas";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import EmptyState from "@/components/frela/EmptyState";
import { JobListSkeleton } from "@/components/frela/JobCardSkeleton";
import AtalhosFiltro from "@/components/vagas/AtalhosFiltro";
import FiltrosSheet from "@/components/vagas/FiltrosSheet";
import ListaVagas from "@/components/vagas/ListaVagas";
import { useFiltrosVagas, useVagasFiltradas } from "@/hooks/useVagas";

/** Buscar: busca por texto + filtros visuais, em lista ou no mapa. */
const SearchTab = () => {
  const { filtros, setFiltros, limpar } = useFiltrosVagas();
  const { lista, empresas, isLoading, localizacao: loc } = useVagasFiltradas();
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [params, setParams] = useSearchParams();
  const vista = params.get("vista") === "mapa" ? "mapa" : "lista";
  const trocarVista = (v: "lista" | "mapa") => {
    const p = new URLSearchParams(params);
    if (v === "mapa") p.set("vista", "mapa");
    else p.delete("vista");
    setParams(p, { replace: true });
  };

  return (
    <div className="pb-24 pt-10">
      <div className="px-5 mb-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-display font-bold text-foreground">Buscar vagas</h1>
          <div className="flex bg-muted rounded-full p-1" role="tablist" aria-label="Visualização">
            {([["lista", List, "Lista"], ["mapa", MapIcon, "Mapa"]] as const).map(([id, Icon, label]) => (
              <button key={id} role="tab" aria-selected={vista === id} onClick={() => trocarVista(id)}
                className={cn("h-8 px-3 rounded-full text-sm font-semibold inline-flex items-center gap-1.5 transition-colors",
                  vista === id ? "bg-card shadow-card text-foreground" : "text-muted-foreground")}>
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Função, empresa, bairro..." value={filtros.q} autoFocus={false}
            onChange={(e) => setFiltros((f) => ({ ...f, q: e.target.value }))}
            className="pl-11 pr-10 h-12 rounded-2xl bg-card shadow-card border-border/70 text-[15px]" aria-label="Buscar vagas" />
          {filtros.q && (
            <button onClick={() => setFiltros((f) => ({ ...f, q: "" }))} aria-label="Limpar busca"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-muted flex items-center justify-center">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <AtalhosFiltro onAbrirFiltros={() => setFiltrosAbertos(true)} />
      </div>
      <div className="px-5">
        <p className="text-sm text-muted-foreground mb-3">{isLoading ? "Carregando..." : `${lista.length} vaga${lista.length === 1 ? "" : "s"}`}</p>
        {vista === "mapa" ? (
          <MapaVagas vagas={lista} empresas={empresas} usuario={loc.real ? loc.ponto : null} onPedirLocalizacao={loc.pedir}
            className="h-[calc(100dvh-300px)] min-h-[360px]" />
        ) : isLoading ? (
          <JobListSkeleton />
        ) : lista.length === 0 ? (
          <EmptyState icon={SearchX} titulo="Nenhuma vaga encontrada" descricao="Tente outra palavra, outra distância ou outro dia."
            acao={<button onClick={limpar} className="text-sm font-semibold text-primary">Limpar filtros</button>} />
        ) : (
          <ListaVagas vagas={lista} empresas={empresas} chave={JSON.stringify(filtros)} mostrarDistancia={loc.real} />
        )}
      </div>
      <FiltrosSheet aberto={filtrosAbertos} onFechar={() => setFiltrosAbertos(false)} />
    </div>
  );
};

export default SearchTab;
