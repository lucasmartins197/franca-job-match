import { describe, expect, it } from "vitest";
import { FILTROS_PADRAO, aplicarFiltros, contarFiltros, localizarVagas } from "@/lib/filtrosVagas";
import { FRANCA, distanciaKm, formatDistancia } from "@/lib/geo";
import type { Tables } from "@/integrations/supabase/types";

const hoje = new Date("2026-10-27T10:00:00"); // terça
const job = (over: Partial<Tables<"jobs">>): Tables<"jobs"> => ({
  id: "j", user_id: "e1", company_name: "Bar", title: "Garçom", category: "Garçom / Eventos", skill: "Garçom", description: "",
  date: "2026-10-27", time_start: "18:00", time_end: "23:00", payment: 150, slots: 1, slots_remaining: 1, neighborhood: "Centro",
  address: "", status: "aberta", created_at: "2026-10-26T10:00:00Z", latitude: null, longitude: null, ...over,
});

const vagas = localizarVagas(
  [
    job({ id: "perto", latitude: -20.54, longitude: -47.40, payment: 120 }),
    job({ id: "longe", latitude: -20.6, longitude: -47.5, payment: 300, date: "2026-10-31", time_start: "09:00", title: "Cozinheiro", category: "Cozinha / Gastronomia", skill: "Cozinheiro" }),
    job({ id: "sem-ponto", user_id: "e2", payment: 200, date: "2026-10-28" }),
  ],
  FRANCA,
  (id) => (id === "e1" ? { lat: -20.55, lon: -47.41 } : null),
);

describe("geo", () => {
  it("calcula e formata distâncias", () => {
    expect(distanciaKm(FRANCA, FRANCA)).toBe(0);
    expect(distanciaKm(FRANCA, { lat: -20.5386, lon: -47.3909 })).toBeGreaterThan(1);
    expect(formatDistancia(0.83)).toBe("850 m");
    expect(formatDistancia(1.234)).toBe("1,2 km");
    expect(formatDistancia(null)).toBeNull();
  });
});

describe("filtros de vagas", () => {
  it("ordena por distância (sem ponto vai para o fim)", () => {
    expect(aplicarFiltros(vagas, FILTROS_PADRAO, [], hoje).map((v) => v.job.id)).toEqual(["perto", "longe", "sem-ponto"]);
  });
  it("filtra por raio, data, valor, período, categoria, busca e salvas", () => {
    const ids = (f: Partial<typeof FILTROS_PADRAO>, salvas: string[] = []) => aplicarFiltros(vagas, { ...FILTROS_PADRAO, ...f }, salvas, hoje).map((v) => v.job.id);
    expect(ids({ raioKm: 2 })).toEqual(["perto"]);
    expect(ids({ data: "hoje" })).toEqual(["perto"]);
    expect(ids({ data: "fds" })).toEqual(["longe"]);
    expect(ids({ valorMin: 200, ordem: "valor" })).toEqual(["longe", "sem-ponto"]);
    expect(ids({ periodos: ["Manhã"] })).toEqual(["longe"]);
    expect(ids({ categoria: "cozinha" })).toEqual(["longe"]);
    expect(ids({ q: "cozinhéiro" })).toEqual(["longe"]);
    expect(ids({ somenteSalvas: true }, ["sem-ponto"])).toEqual(["sem-ponto"]);
  });
  it("conta filtros ativos", () => {
    expect(contarFiltros(FILTROS_PADRAO)).toBe(0);
    expect(contarFiltros({ ...FILTROS_PADRAO, raioKm: 5, periodos: ["Noite"], q: "x" })).toBe(2);
  });
});
