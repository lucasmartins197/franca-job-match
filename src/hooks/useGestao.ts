import { createContext, useContext } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Fn = Database["public"]["Functions"];
export type EmpresaGestao = Fn["admin_listar_empresas"]["Returns"][number];
export type ProfissionalGestao = Fn["admin_listar_profissionais"]["Returns"][number];
export type VagaGestao = Fn["admin_listar_vagas"]["Returns"][number];
export type ContratacaoGestao = Fn["admin_listar_contratacoes"]["Returns"][number];
export type IndicacaoGestao = Fn["admin_indicacoes"]["Returns"][number];

export interface VisaoGeral {
  empresas: number; profissionais: number; cadastros: number; cadastros_mes: number;
  empresas_ativas: number; profissionais_ativos: number;
  assinantes_empresa: number; assinantes_profissional: number; conversao: number;
  mrr: number; taxas_mes: number; taxas_total: number; taxas_pagas: number; taxas_a_receber: number;
  receita_mes: number; receita_acumulada: number; assinaturas_registradas: number;
  contratacoes_mes: number; contratacoes_total: number; movimentado_mes: number; movimentado_total: number;
  divergencias: number; suporte_abertos: number; empresas_travadas: number; teto_taxas: number;
  vagas: { aberta: number; preenchida: number; finalizada: number; cancelada: number };
  precos: { empresa: number; freelancer: number };
}

/** Filtro global do painel: incluir ou não os dados fictícios (seed demo). */
export const GestaoContext = createContext<{ incluirDemo: boolean; setIncluirDemo: (v: boolean) => void }>({
  incluirDemo: true,
  setIncluirDemo: () => {},
});
export const useGestaoFiltro = () => useContext(GestaoContext);

// O Postgres devolve numeric como texto; converte só o que é número (nunca códigos/telefones).
const TEXTO = new Set(["id", "telefone", "codigo_indicacao", "indicador_codigo", "cnpj", "email", "nome", "titulo", "vaga", "bairro"]);
const num = <T extends object>(o: T): T =>
  Object.fromEntries(
    Object.entries(o).map(([k, v]) => [k, !TEXTO.has(k) && typeof v === "string" && /^-?\d+(\.\d+)?$/.test(v) ? Number(v) : v])
  ) as T;

const rpcErro = (error: { message: string } | null) => {
  if (!error) return;
  if (error.message.includes("Could not find the function") || error.message.includes("does not exist")) {
    throw new Error("Painel indisponível: rode o SQL da Fase 5 no Supabase.");
  }
  throw new Error(error.message);
};

export const useVisaoGeral = () => {
  const { incluirDemo } = useGestaoFiltro();
  return useQuery({
    queryKey: ["gestao", "visao", incluirDemo],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_visao_geral", { p_incluir_demo: incluirDemo });
      rpcErro(error);
      const v = data as unknown as VisaoGeral;
      return { ...num(v), vagas: num(v.vagas), precos: num(v.precos) };
    },
  });
};

export const useCrescimento = (semanas = 12) => {
  const { incluirDemo } = useGestaoFiltro();
  return useQuery({
    queryKey: ["gestao", "crescimento", semanas, incluirDemo],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_crescimento", { p_semanas: semanas, p_incluir_demo: incluirDemo });
      rpcErro(error);
      return (data ?? []).map(num);
    },
  });
};

export const useReceitaMensal = (meses = 6) => {
  const { incluirDemo } = useGestaoFiltro();
  return useQuery({
    queryKey: ["gestao", "receita-mensal", meses, incluirDemo],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_receita_mensal", { p_meses: meses, p_incluir_demo: incluirDemo });
      rpcErro(error);
      return (data ?? []).map(num);
    },
  });
};

const useLista = <K extends "admin_listar_empresas" | "admin_listar_profissionais" | "admin_listar_vagas" | "admin_listar_contratacoes" | "admin_indicacoes">(fn: K) => {
  const { incluirDemo } = useGestaoFiltro();
  return useQuery({
    queryKey: ["gestao", fn, incluirDemo],
    queryFn: async () => {
      const { data, error } = await supabase.rpc(fn, { p_incluir_demo: incluirDemo });
      rpcErro(error);
      return ((data ?? []) as Fn[K]["Returns"]).map(num) as Fn[K]["Returns"];
    },
  });
};

export const useEmpresasGestao = () => useLista("admin_listar_empresas");
export const useProfissionaisGestao = () => useLista("admin_listar_profissionais");
export const useVagasGestao = () => useLista("admin_listar_vagas");
export const useContratacoesGestao = () => useLista("admin_listar_contratacoes");
export const useIndicacoesGestao = () => useLista("admin_indicacoes");

export interface UsuarioDetalhe {
  profile: Record<string, unknown> & {
    id: string; nome: string | null; email: string; tipo: string; telefone: string | null; cidade: string | null;
    foto_url: string | null; created_at: string; ultima_atividade: string; verificado: boolean; destaque: boolean;
    selos_extras: string[]; meta_ajuste_trabalhos: number; avaliacao_media: number; total_avaliacoes: number;
    subscription_status: string | null; subscription_end: string | null; codigo_indicacao: string | null; is_demo: boolean;
  };
  empresa: Record<string, string | number | null> | null;
  profissional: { profissoes: string[] | null; experiencia: string | null; bio: string | null; disponibilidade: string | null; instagram: string | null; linkedin: string | null } | null;
  contratacoes: { id: string; vaga: string; valor: number; status: string; status_taxa: string | null; taxa: number; criada_em: string; finalizada_em: string | null; outra_parte: string }[];
  vagas: { id: string; titulo: string; data: string; valor: number; status: string; candidaturas: number }[];
  candidaturas: { vaga: string; empresa: string; status: string; criada_em: string }[];
  avaliacoes: { nota: number; comentario: string | null; de: string; criada_em: string }[];
  pagamentos: { tipo: string; valor: number; status: string; referencia: string | null; criado_em: string }[];
  indicados: { id: string; nome: string; tipo: string; criado_em: string }[];
  indicado_por_nome: string | null;
  suporte_mensagens: number;
  saldo_taxas: number;
}

export const useUsuarioDetalhe = (id?: string) =>
  useQuery({
    queryKey: ["gestao", "usuario", id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_usuario_detalhe", { p_id: id! });
      rpcErro(error);
      return data as unknown as UsuarioDetalhe | null;
    },
    enabled: !!id,
  });

const useAcao = <A,>(fn: (args: A) => Promise<void>) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gestao"] });
      qc.invalidateQueries({ queryKey: ["perfil"] });
      qc.invalidateQueries({ queryKey: ["profiles"] });
    },
  });
};

export const usePromover = () =>
  useAcao(async (a: { id: string; verificado?: boolean; destaque?: boolean; selos?: string[] }) => {
    const { error } = await supabase.rpc("admin_promover", {
      p_id: a.id, p_verificado: a.verificado, p_destaque: a.destaque, p_selos_extras: a.selos,
    });
    rpcErro(error);
  });

export const useAjustarMeta = () =>
  useAcao(async (a: { id: string; ajuste: number }) => {
    const { error } = await supabase.rpc("admin_ajustar_meta", { p_id: a.id, p_ajuste: a.ajuste });
    rpcErro(error);
  });

export const useLiberarRecompensa = () =>
  useAcao(async (a: { indicadoId: string; liberada: boolean }) => {
    const { error } = await supabase.rpc("admin_liberar_recompensa", { p_indicado: a.indicadoId, p_liberada: a.liberada });
    rpcErro(error);
  });

/** Dias desde uma data (para "há quanto tempo"). */
export const diasDesde = (iso?: string | null) =>
  iso ? Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)) : null;
