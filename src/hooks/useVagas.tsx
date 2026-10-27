import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useJobs } from "./useJobs";
import { useProfilesByIds } from "./useFrela";
import { useLocalizacao } from "./useLocalizacao";
import { useVagasSalvas } from "./useVagasSalvas";
import { FILTROS_PADRAO, FiltrosVagas, aplicarFiltros, localizarVagas } from "@/lib/filtrosVagas";
import type { Ponto } from "@/lib/geo";

/** Coordenadas das empresas (reserva para vagas sem lat/long próprias). */
const usePontosEmpresas = (ids: string[]) => {
  const unicos = Array.from(new Set(ids)).sort();
  return useQuery({
    queryKey: ["empresas-pontos", unicos],
    queryFn: async () => {
      const { data, error } = await supabase.from("empresa_dados").select("profile_id, latitude, longitude").in("profile_id", unicos);
      if (error) return {} as Record<string, Ponto>;
      return Object.fromEntries(
        data.filter((e) => e.latitude != null && e.longitude != null).map((e) => [e.profile_id, { lat: e.latitude!, lon: e.longitude! }]),
      ) as Record<string, Ponto>;
    },
    enabled: unicos.length > 0,
    staleTime: 5 * 60_000,
  });
};

/** Vagas abertas com local, distância do usuário e perfil da empresa. */
export const useVagasLocalizadas = () => {
  const jobsQuery = useJobs();
  const jobs = useMemo(() => jobsQuery.data ?? [], [jobsQuery.data]);
  const donos = jobs.map((j) => j.user_id);
  const { data: pontos = {} } = usePontosEmpresas(donos);
  const { data: empresas = {} } = useProfilesByIds(donos);
  const loc = useLocalizacao();
  const vagas = useMemo(() => localizarVagas(jobs, loc.ponto, (id) => pontos[id] ?? null), [jobs, loc.ponto, pontos]);
  return { vagas, empresas, isLoading: jobsQuery.isLoading, refetch: jobsQuery.refetch, localizacao: loc };
};

// ─────────────────────────────────────────────
// Filtros compartilhados entre Início e Buscar
// ─────────────────────────────────────────────

const CHAVE = "frela-filtros";
const lerFiltros = (): FiltrosVagas => {
  try {
    return { ...FILTROS_PADRAO, ...JSON.parse(sessionStorage.getItem(CHAVE) ?? "{}") };
  } catch {
    return FILTROS_PADRAO;
  }
};

interface CtxFiltros {
  filtros: FiltrosVagas;
  setFiltros: (f: FiltrosVagas | ((f: FiltrosVagas) => FiltrosVagas)) => void;
  limpar: () => void;
}
const Ctx = createContext<CtxFiltros | null>(null);

export const FiltrosVagasProvider = ({ children }: { children: ReactNode }) => {
  const [filtros, set] = useState<FiltrosVagas>(lerFiltros);
  const valor = useMemo<CtxFiltros>(() => {
    const setFiltros: CtxFiltros["setFiltros"] = (f) =>
      set((atual) => {
        const novo = typeof f === "function" ? f(atual) : f;
        try {
          sessionStorage.setItem(CHAVE, JSON.stringify(novo));
        } catch {
          /* sem storage */
        }
        return novo;
      });
    return { filtros, setFiltros, limpar: () => setFiltros({ ...FILTROS_PADRAO, ordem: filtros.ordem }) };
  }, [filtros]);
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
};

export const useFiltrosVagas = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useFiltrosVagas fora do FiltrosVagasProvider");
  return v;
};

/** Vagas filtradas e ordenadas com os filtros atuais. */
export const useVagasFiltradas = (sobrescrever?: Partial<FiltrosVagas>) => {
  const base = useVagasLocalizadas();
  const { filtros } = useFiltrosVagas();
  const { salvas } = useVagasSalvas();
  const efetivos = useMemo(() => {
    const f = { ...filtros, ...sobrescrever };
    // sem localização real não há como ordenar por distância de verdade
    return !base.localizacao.real && f.ordem === "distancia" ? { ...f, ordem: "data" as const } : f;
  }, [filtros, sobrescrever, base.localizacao.real]);
  const lista = useMemo(() => aplicarFiltros(base.vagas, efetivos, salvas), [base.vagas, efetivos, salvas]);
  return { ...base, lista, filtros: efetivos };
};
