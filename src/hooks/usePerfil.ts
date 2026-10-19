import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "./useAuth";

export type DbEmpresaDados = Tables<"empresa_dados">;
export type DbProfissionalDados = Tables<"profissional_dados">;
export type DbPortfolioFoto = Tables<"portfolio_fotos">;

export interface PerfilCompleto {
  profile: Tables<"profiles">;
  empresa: DbEmpresaDados | null;
  profissional: DbProfissionalDados | null;
}

const preenchido = (v: string | null | undefined) => !!v && v.trim().length > 0;

/** Lista do que falta para o perfil ficar completo (vazia = completo). */
export const camposFaltando = (p: PerfilCompleto | null | undefined): string[] => {
  if (!p) return ["perfil"];
  const { profile } = p;
  const faltando: string[] = [];
  if (!preenchido(profile.foto_url)) faltando.push("foto");
  if (!preenchido(profile.nome)) faltando.push("nome");
  if (!preenchido(profile.telefone)) faltando.push("telefone");
  if (!preenchido(profile.cidade)) faltando.push("cidade");

  if (profile.tipo === "empresa") {
    const e = p.empresa;
    if (!preenchido(e?.nome_empresa)) faltando.push("nome da empresa");
    if (!preenchido(e?.ramo)) faltando.push("ramo");
    if (!preenchido(e?.endereco)) faltando.push("endereço");
  } else {
    const d = p.profissional;
    if (!d?.profissoes || d.profissoes.length === 0) faltando.push("profissões");
    if (!preenchido(d?.experiencia)) faltando.push("experiência");
    if (!preenchido(d?.bio)) faltando.push("sobre você");
    if (!preenchido(d?.disponibilidade)) faltando.push("disponibilidade");
  }
  return faltando;
};

const fetchPerfil = async (id: string): Promise<PerfilCompleto | null> => {
  const [{ data: profile, error }, { data: empresa }, { data: profissional }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
    supabase.from("empresa_dados").select("*").eq("profile_id", id).maybeSingle(),
    supabase.from("profissional_dados").select("*").eq("profile_id", id).maybeSingle(),
  ]);
  if (error) throw error;
  if (!profile) return null;
  return { profile, empresa: empresa ?? null, profissional: profissional ?? null };
};

/** Perfil do usuário logado + status de completude (usado pela trava de "perfil obrigatório"). */
export const useMeuPerfil = () => {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["perfil", user?.id],
    queryFn: () => fetchPerfil(user!.id),
    enabled: !!user,
  });
  const faltando = camposFaltando(query.data);
  return { ...query, faltando, completo: !!query.data && faltando.length === 0 };
};

export const usePerfilPublico = (id?: string) => {
  return useQuery({
    queryKey: ["perfil", id],
    queryFn: () => fetchPerfil(id!),
    enabled: !!id,
  });
};

export interface ItemHistorico {
  contratacao_id: string;
  titulo: string;
  empresa: string;
  data: string;
  finalizada_em: string | null;
  nota: number | null;
  comentario: string | null;
}

/** Histórico de trabalhos finalizados (função SQL historico_profissional). */
export const useHistoricoProfissional = (id?: string, enabled = true) => {
  return useQuery({
    queryKey: ["historico", id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("historico_profissional", { p_id: id! });
      if (error) {
        console.warn("historico_profissional indisponível — rode o SQL da Fase 2", error);
        return null;
      }
      return data as ItemHistorico[];
    },
    enabled: !!id && enabled,
  });
};

/** Mapa profissional_id → nº de trabalhos finalizados. */
export const useTrabalhosFinalizados = (ids: string[]) => {
  const unique = Array.from(new Set(ids)).sort();
  return useQuery({
    queryKey: ["trabalhos-finalizados", unique],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("trabalhos_finalizados", { p_ids: unique });
      if (error) {
        console.warn("trabalhos_finalizados indisponível — rode o SQL da Fase 2", error);
        return {} as Record<string, number>;
      }
      return Object.fromEntries(data.map((r) => [r.profissional_id, r.total])) as Record<string, number>;
    },
    enabled: unique.length > 0,
  });
};

export const useContratacoesEmpresa = (id?: string, enabled = true) => {
  return useQuery({
    queryKey: ["contratacoes-empresa", id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("contratacoes_finalizadas_empresa", { p_id: id! });
      if (error) return null;
      return data as number;
    },
    enabled: !!id && enabled,
  });
};

export const useInvalidatePerfil = () => {
  const queryClient = useQueryClient();
  return () =>
    Promise.all(
      ["perfil", "profile", "profiles", "perfil-extras", "empresa-dados", "profissional-dados"].map((key) =>
        queryClient.invalidateQueries({ queryKey: [key] })
      )
    );
};

// ─────────────────────────────────────────────
// Foto de perfil
// ─────────────────────────────────────────────

/** Reduz a foto para no máx. 640px (JPEG) antes de enviar — fotos de celular costumam ter 4MB+. */
export const redimensionar = (file: File, max = 640): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const escala = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * escala);
      canvas.height = Math.round(img.height * escala);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Falha ao processar a imagem"))), "image/jpeg", 0.85);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Arquivo de imagem inválido"));
    };
    img.src = url;
  });

export const uploadFotoPerfil = async (userId: string, file: File): Promise<string> => {
  if (!file.type.startsWith("image/")) throw new Error("Escolha um arquivo de imagem");
  const blob = await redimensionar(file);
  const path = `${userId}/avatar-${Date.now()}.jpg`;
  const { error } = await supabase.storage.from("avatars").upload(path, blob, {
    contentType: "image/jpeg",
    upsert: true,
  });
  if (error) {
    if (error.message.toLowerCase().includes("bucket not found")) {
      throw new Error("Armazenamento de fotos não configurado (rode o SQL da Fase 2).");
    }
    throw error;
  }
  return supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
};

// ─────────────────────────────────────────────
// Formatação de redes sociais / disponibilidade
// ─────────────────────────────────────────────

export const normalizarInstagram = (v: string) =>
  v.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "").replace(/\/.*$/, "");

export const instagramUrl = (handle: string) => `https://instagram.com/${normalizarInstagram(handle)}`;

export const normalizarLinkedin = (v: string) => {
  const t = v.trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  if (/linkedin\.com/i.test(t)) return `https://${t}`;
  return `https://www.linkedin.com/in/${t.replace(/^\/?(in\/)?/, "")}`;
};

export const DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
export const PERIODOS = ["Manhã", "Tarde", "Noite", "Madrugada"];

export const parseDisponibilidade = (texto: string | null | undefined) => {
  const tokens = (texto ?? "").split(/[·,|]/).map((t) => t.trim()).filter(Boolean);
  return {
    dias: DIAS.filter((d) => tokens.includes(d)),
    periodos: PERIODOS.filter((p) => tokens.includes(p)),
    obs: tokens.filter((t) => !DIAS.includes(t) && !PERIODOS.includes(t)).join(", "),
  };
};

export const formatDisponibilidade = (dias: string[], periodos: string[], obs: string) =>
  [dias.join(", "), periodos.join(", "), obs.trim()].filter(Boolean).join(" · ");

// ─────────────────────────────────────────────
// Portfólio (galeria de trabalhos do profissional)
// ─────────────────────────────────────────────

export const MAX_PORTFOLIO = 12;

export const usePortfolio = (profileId?: string) => {
  return useQuery({
    queryKey: ["portfolio", profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("portfolio_fotos")
        .select("*")
        .eq("profile_id", profileId!)
        .order("created_at", { ascending: false });
      if (error) {
        console.warn("portfolio_fotos indisponível — rode o SQL da Fase 3", error);
        return [] as DbPortfolioFoto[];
      }
      return data;
    },
    enabled: !!profileId,
  });
};

/** Envia uma foto para <user>/portfolio/ no bucket "avatars" e registra em portfolio_fotos. */
export const adicionarFotoPortfolio = async (userId: string, file: File) => {
  if (!file.type.startsWith("image/")) throw new Error("Escolha arquivos de imagem");
  const blob = await redimensionar(file, 1280);
  const path = `${userId}/portfolio/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const { error } = await supabase.storage.from("avatars").upload(path, blob, { contentType: "image/jpeg" });
  if (error) throw error;
  const url = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
  const { error: e2 } = await supabase.from("portfolio_fotos").insert({ profile_id: userId, url });
  if (e2) {
    await supabase.storage.from("avatars").remove([path]);
    throw new Error(e2.message.includes("portfolio_fotos") ? "Banco desatualizado: rode o SQL da Fase 3." : e2.message);
  }
};

export const removerFotoPortfolio = async (foto: DbPortfolioFoto) => {
  const { error } = await supabase.from("portfolio_fotos").delete().eq("id", foto.id);
  if (error) throw error;
  const marcador = "/object/public/avatars/";
  const i = foto.url.indexOf(marcador);
  if (i >= 0) await supabase.storage.from("avatars").remove([decodeURIComponent(foto.url.slice(i + marcador.length))]);
};

// ─────────────────────────────────────────────
// Selos
// ─────────────────────────────────────────────

export type Selo = { id: string; texto: string; tipo: "indicado" | "verificado" | "top" | "destaque" | "trabalhos" | "novo" };

/** Regras dos selos — iguais às do banco (frela_meta_trabalhos / frela_nota_minima_indicado / frela_eh_indicado). */
export const META_TRABALHOS = 10;
export const NOTA_MINIMA_INDICADO = 4.5;
export const MIN_AVALIACOES_SELO = 3;
export const NOTA_TOP_AVALIADO = 4.7;

/** Selo "Indicado": 10 trabalhos finalizados (+ ajuste do ADM) e nota >= 4,5 com 3+ avaliações — ou concedido pelo ADM. */
export const ehIndicado = (profile: Tables<"profiles">, trabalhos?: number | null) => {
  if (profile.selos_extras?.includes("indicado")) return true;
  const total = (trabalhos ?? 0) + (profile.meta_ajuste_trabalhos ?? 0);
  return total >= META_TRABALHOS && (profile.total_avaliacoes ?? 0) >= MIN_AVALIACOES_SELO && Number(profile.avaliacao_media ?? 0) >= NOTA_MINIMA_INDICADO;
};

export const ehTopAvaliado = (profile: Tables<"profiles">) =>
  (profile.total_avaliacoes ?? 0) >= MIN_AVALIACOES_SELO && Number(profile.avaliacao_media ?? 0) >= NOTA_TOP_AVALIADO;

/** Selos de um perfil, do mais importante para o menos. Só o sistema/ADM controla os dados que geram selos. */
export const selosDe = (profile: Tables<"profiles">, trabalhos?: number | null): Selo[] => {
  const isEmpresa = profile.tipo === "empresa";
  const total = profile.total_avaliacoes ?? 0;
  const selos: Selo[] = [];
  if (!isEmpresa && ehIndicado(profile, trabalhos)) selos.push({ id: "indicado", texto: "Indicado", tipo: "indicado" });
  if (profile.verificado) selos.push({ id: "verificado", texto: isEmpresa ? "Empresa verificada" : "Verificado", tipo: "verificado" });
  if (ehTopAvaliado(profile)) selos.push({ id: "top", texto: isEmpresa ? "Top avaliada" : "Top avaliado", tipo: "top" });
  if (profile.destaque) selos.push({ id: "destaque", texto: "Destaque", tipo: "destaque" });
  if (trabalhos && trabalhos > 0) {
    selos.push({ id: "trabalhos", texto: `${trabalhos} ${isEmpresa ? (trabalhos === 1 ? "contratação" : "contratações") : trabalhos === 1 ? "trabalho" : "trabalhos"}`, tipo: "trabalhos" });
  } else if (total === 0) {
    selos.push({ id: "novo", texto: "Novo no FreLa", tipo: "novo" });
  }
  return selos;
};

/** Relevância para ordenar (mesma lógica de recomendados_profissionais no banco). */
export const relevanciaPerfil = (profile: Tables<"profiles">, trabalhos?: number | null) =>
  (ehIndicado(profile, trabalhos) ? 4 : 0) + (profile.verificado ? 2 : 0) + (profile.destaque ? 2 : 0) + (ehTopAvaliado(profile) ? 1 : 0);

export interface Meta {
  id: "indicado" | "top" | "verificado";
  titulo: string;
  atingida: boolean;
  progresso: number; // 0–100
  detalhe: string;
  dica: string;
}

/** Metas do profissional rumo aos selos (para a barra de progresso motivadora). */
export const metasDoProfissional = (profile: Tables<"profiles">, trabalhos: number): Meta[] => {
  const feitos = trabalhos + (profile.meta_ajuste_trabalhos ?? 0);
  const media = Number(profile.avaliacao_media ?? 0);
  const aval = profile.total_avaliacoes ?? 0;
  const indicado = ehIndicado(profile, trabalhos);
  const faltamTrab = Math.max(0, META_TRABALHOS - feitos);
  const faltamAval = Math.max(0, MIN_AVALIACOES_SELO - aval);
  const notaOk = aval >= MIN_AVALIACOES_SELO && media >= NOTA_MINIMA_INDICADO;

  const dicaIndicado = indicado
    ? "Você aparece primeiro nas recomendações e buscas das empresas!"
    : faltamTrab > 0
      ? `Faltam ${faltamTrab} trabalho${faltamTrab === 1 ? "" : "s"} para o selo Indicado!${notaOk || aval === 0 ? "" : ` E mantenha nota ${NOTA_MINIMA_INDICADO.toFixed(1).replace(".", ",")}+.`}`
      : faltamAval > 0
        ? `Você já tem os trabalhos! Falta${faltamAval === 1 ? "" : "m"} ${faltamAval} avaliaç${faltamAval === 1 ? "ão" : "ões"}.`
        : `Quase lá: suba sua nota para ${NOTA_MINIMA_INDICADO.toFixed(1).replace(".", ",")} ou mais.`;

  const top = ehTopAvaliado(profile);
  return [
    {
      id: "indicado", titulo: "Selo Indicado", atingida: indicado,
      progresso: indicado ? 100 : Math.min(99, (feitos / META_TRABALHOS) * 100),
      detalhe: `${Math.min(feitos, META_TRABALHOS)}/${META_TRABALHOS} trabalhos · nota ${aval ? media.toFixed(1).replace(".", ",") : "—"} (mín. ${NOTA_MINIMA_INDICADO.toFixed(1).replace(".", ",")})`,
      dica: dicaIndicado,
    },
    {
      id: "top", titulo: "Top avaliado", atingida: top,
      progresso: top ? 100 : Math.min(99, (Math.min(aval, MIN_AVALIACOES_SELO) / MIN_AVALIACOES_SELO) * (media >= NOTA_TOP_AVALIADO || aval === 0 ? 100 : 70)),
      detalhe: `${aval} avaliaç${aval === 1 ? "ão" : "ões"} · nota ${aval ? media.toFixed(1).replace(".", ",") : "—"} (mín. ${NOTA_TOP_AVALIADO.toFixed(1).replace(".", ",")})`,
      dica: top ? "Sua reputação está entre as melhores." : faltamAval > 0 ? `Receba mais ${faltamAval} avaliaç${faltamAval === 1 ? "ão" : "ões"} com nota alta.` : `Mantenha nota ${NOTA_TOP_AVALIADO.toFixed(1).replace(".", ",")} ou mais.`,
    },
    {
      id: "verificado", titulo: "Verificado", atingida: !!profile.verificado, progresso: profile.verificado ? 100 : 0,
      detalhe: "Concedido pela equipe FreLa",
      dica: profile.verificado ? "Sua identidade foi conferida." : "Peça a verificação no suporte (envie um documento com foto).",
    },
  ];
};

// ─────────────────────────────────────────────
// Geocodificação (endereço → lat/long) via OpenStreetMap Nominatim — sem chave
// ─────────────────────────────────────────────

export interface Coordenadas {
  lat: number;
  lon: number;
}

export const geocodificar = async (endereco: string, cidade = "Franca"): Promise<Coordenadas | null> => {
  const q = `${endereco}, ${cidade}, SP, Brasil`;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&accept-language=pt-BR&q=${encodeURIComponent(q)}`
    );
    if (!res.ok) return null;
    const [hit] = (await res.json()) as { lat: string; lon: string }[];
    return hit ? { lat: Number(hit.lat), lon: Number(hit.lon) } : null;
  } catch {
    return null;
  }
};

/** Coordenadas de um endereço (usa lat/long salvos quando houver). */
export const useCoordenadas = (endereco?: string | null, cidade?: string | null, salvas?: Coordenadas | null) => {
  return useQuery({
    queryKey: ["geocode", endereco, cidade],
    queryFn: () => geocodificar(endereco!, cidade || "Franca"),
    enabled: !salvas && !!endereco && endereco.trim().length > 3,
    staleTime: Infinity,
    gcTime: 24 * 60 * 60 * 1000,
    retry: false,
    initialData: salvas ?? undefined,
  });
};
