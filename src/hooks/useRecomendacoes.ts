import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { Selo } from "./usePerfil";

type Fn = Database["public"]["Functions"];
export type ProfissionalRecomendado = Fn["recomendados_profissionais"]["Returns"][number];
export type EmpresaRecomendada = Fn["recomendadas_empresas"]["Returns"][number];

const numeros = <T extends object>(o: T): T =>
  Object.fromEntries(Object.entries(o).map(([k, v]) => [k, ["avaliacao_media"].includes(k) && typeof v === "string" ? Number(v) : v])) as T;

/** Vitrine de profissionais: selo > avaliação > nº de trabalhos (ordem calculada no banco). */
export const useRecomendadosProfissionais = (limite = 60) =>
  useQuery({
    queryKey: ["recomendados", "profissionais", limite],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("recomendados_profissionais", { p_limite: limite });
      if (error) {
        console.warn("recomendados_profissionais indisponível — rode o SQL da Fase 6", error);
        return [] as ProfissionalRecomendado[];
      }
      return data.map(numeros);
    },
    staleTime: 60_000,
  });

/** Melhores lugares para trabalhar: empresas com selo, bem avaliadas e que mais contratam. */
export const useRecomendadasEmpresas = (limite = 60) =>
  useQuery({
    queryKey: ["recomendados", "empresas", limite],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("recomendadas_empresas", { p_limite: limite });
      if (error) {
        console.warn("recomendadas_empresas indisponível — rode o SQL da Fase 6", error);
        return [] as EmpresaRecomendada[];
      }
      return data.map(numeros);
    },
    staleTime: 60_000,
  });

export const selosRecomendado = (r: { indicado?: boolean; verificado: boolean; destaque: boolean; top_avaliado?: boolean; top_avaliada?: boolean }, empresa = false): Selo[] => {
  const s: Selo[] = [];
  if (r.indicado) s.push({ id: "indicado", texto: "Indicado", tipo: "indicado" });
  if (r.verificado) s.push({ id: "verificado", texto: empresa ? "Empresa verificada" : "Verificado", tipo: "verificado" });
  if (r.top_avaliado || r.top_avaliada) s.push({ id: "top", texto: empresa ? "Top avaliada" : "Top avaliado", tipo: "top" });
  if (r.destaque) s.push({ id: "destaque", texto: "Destaque", tipo: "destaque" });
  return s;
};
