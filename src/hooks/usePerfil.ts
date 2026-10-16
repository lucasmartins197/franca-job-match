import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "./useAuth";

export type DbEmpresaDados = Tables<"empresa_dados">;
export type DbProfissionalDados = Tables<"profissional_dados">;

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
const redimensionar = (file: File, max = 640): Promise<Blob> =>
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
