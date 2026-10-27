import type { Tables } from "@/integrations/supabase/types";
import { categoriaDe } from "@/lib/categorias";
import { Ponto, distanciaKm } from "@/lib/geo";
import { Periodo, diasAte, periodoDe } from "@/lib/vagas";

type Job = Tables<"jobs">;

export type FiltroData = "todas" | "hoje" | "amanha" | "semana" | "fds";
export type Ordem = "distancia" | "data" | "valor";

export interface FiltrosVagas {
  q: string;
  /** id da categoria (src/lib/categorias.ts) */
  categoria: string | null;
  raioKm: number | null;
  data: FiltroData;
  valorMin: number | null;
  periodos: Periodo[];
  somenteSalvas: boolean;
  ordem: Ordem;
}

export const FILTROS_PADRAO: FiltrosVagas = {
  q: "", categoria: null, raioKm: null, data: "todas", valorMin: null, periodos: [], somenteSalvas: false, ordem: "distancia",
};

export const RAIOS = [2, 5, 10, 25];
export const VALORES_MIN = [100, 150, 200, 300];
export const OPCOES_DATA: { id: FiltroData; label: string }[] = [
  { id: "todas", label: "Qualquer dia" }, { id: "hoje", label: "Hoje" }, { id: "amanha", label: "Amanhã" },
  { id: "semana", label: "Próximos 7 dias" }, { id: "fds", label: "Fim de semana" },
];

export interface VagaLocalizada {
  job: Job;
  /** onde é a vaga (coordenadas da vaga ou, sem elas, da empresa) */
  ponto: Ponto | null;
  distanciaKm: number | null;
}

/** Junta cada vaga ao seu ponto no mapa e à distância do usuário. */
export const localizarVagas = (jobs: Job[], origem: Ponto | null, pontoEmpresa: (empresaId: string) => Ponto | null): VagaLocalizada[] =>
  jobs.map((job) => {
    const ponto = job.latitude != null && job.longitude != null ? { lat: job.latitude, lon: job.longitude } : pontoEmpresa(job.user_id);
    return { job, ponto, distanciaKm: origem && ponto ? distanciaKm(origem, ponto) : null };
  });

const casaData = (date: string, filtro: FiltroData, hoje: Date) => {
  const d = diasAte(date, hoje);
  switch (filtro) {
    case "hoje": return d === 0;
    case "amanha": return d === 1;
    case "semana": return d >= 0 && d <= 7;
    case "fds": {
      const dow = new Date(`${date}T12:00:00`).getDay();
      return d >= 0 && d <= 7 && (dow === 0 || dow === 6);
    }
    default: return true;
  }
};

const normalizar = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Aplica busca + filtros e ordena. */
export const aplicarFiltros = (vagas: VagaLocalizada[], f: FiltrosVagas, salvas: string[] = [], hoje = new Date()) => {
  const q = normalizar(f.q.trim());
  const lista = vagas.filter(({ job, distanciaKm: dist }) => {
    if (q && !normalizar([job.title, job.company_name, job.skill, job.category, job.neighborhood, job.description].join(" ")).includes(q)) return false;
    if (f.categoria && categoriaDe(job.category)?.id !== f.categoria) return false;
    if (f.raioKm != null && (dist == null || dist > f.raioKm)) return false;
    if (!casaData(job.date, f.data, hoje)) return false;
    if (f.valorMin != null && Number(job.payment) < f.valorMin) return false;
    if (f.periodos.length > 0) {
      const p = periodoDe(job.time_start);
      if (!p || !f.periodos.includes(p)) return false;
    }
    if (f.somenteSalvas && !salvas.includes(job.id)) return false;
    return true;
  });
  const porData = (a: VagaLocalizada, b: VagaLocalizada) => a.job.date.localeCompare(b.job.date) || a.job.time_start.localeCompare(b.job.time_start);
  return lista.sort((a, b) => {
    if (f.ordem === "valor") return Number(b.job.payment) - Number(a.job.payment) || porData(a, b);
    if (f.ordem === "distancia" && (a.distanciaKm != null || b.distanciaKm != null)) {
      return (a.distanciaKm ?? Infinity) - (b.distanciaKm ?? Infinity) || porData(a, b);
    }
    return porData(a, b);
  });
};

/** Quantos filtros (fora a busca e a ordem) estão ligados. */
export const contarFiltros = (f: FiltrosVagas) =>
  [f.categoria != null, f.raioKm != null, f.data !== "todas", f.valorMin != null, f.periodos.length > 0, f.somenteSalvas].filter(Boolean).length;
