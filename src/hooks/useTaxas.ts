import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { ContratacaoComJob } from "./useFrela";
import { AVISO_TAXAS_PCT, TETO_TAXAS } from "@/lib/pagamentos";

export interface ResumoTaxas {
  saldo: number;
  a_confirmar: number;
  confirmado: number;
  em_divergencia: number;
  pago: number;
  teto: number;
  bloqueado: boolean;
  pode_renovar: boolean;
  /** Créditos disponíveis (Indique e Ganhe) e total de taxas antes do crédito */
  creditos: number;
  bruto: number;
  /** saldo >= AVISO_TAXAS_PCT do teto (e ainda não travado) */
  perto: boolean;
  /** SQL da Fase 4 ainda não rodado */
  indisponivel?: boolean;
}

const VAZIO: ResumoTaxas = {
  saldo: 0, a_confirmar: 0, confirmado: 0, em_divergencia: 0, pago: 0,
  teto: TETO_TAXAS, bloqueado: false, pode_renovar: true, perto: false, creditos: 0, bruto: 0,
};

/** Mensagem amigável para os erros de trava vindos do banco. */
export const mensagemTrava = (err: unknown): string | null => {
  const msg = err instanceof Error ? err.message : typeof err === "object" && err && "message" in err ? String((err as { message: unknown }).message) : "";
  if (msg.includes("TRAVA_TAXAS")) return "Seu saldo de taxas atingiu o limite. Quite as taxas em “Minhas taxas” para continuar.";
  if (msg.includes("TRAVA_CONTRATACAO_EM_ANDAMENTO")) return "Confirme o serviço em andamento com o código antes de criar uma nova vaga.";
  if (msg.includes("TRAVA_AVALIACAO")) return "Você tem uma avaliação pendente. Avalie o último serviço para continuar.";
  if (msg.includes("TRAVA_CODIGO")) return "Confirme o serviço anterior com o código da empresa antes de se candidatar.";
  return null;
};

/** Resumo da conta de taxas da empresa logada (saldo, teto, trava). */
export const useResumoTaxas = () => {
  const { user, userTipo } = useAuth();
  const query = useQuery({
    queryKey: ["taxas", "resumo", user?.id],
    queryFn: async (): Promise<ResumoTaxas> => {
      const { data, error } = await supabase.rpc("minhas_taxas_resumo");
      if (error || !data?.[0]) {
        if (error) console.warn("minhas_taxas_resumo indisponível — rode o SQL da Fase 4", error);
        return { ...VAZIO, indisponivel: !!error };
      }
      const r = data[0];
      const n = (v: number) => Number(v ?? 0);
      const teto = n(r.teto) || TETO_TAXAS;
      const saldo = n(r.saldo);
      return {
        saldo, teto,
        a_confirmar: n(r.a_confirmar), confirmado: n(r.confirmado), em_divergencia: n(r.em_divergencia), pago: n(r.pago),
        bloqueado: !!r.bloqueado, pode_renovar: !!r.pode_renovar,
        creditos: n(r.creditos), bruto: n(r.bruto ?? r.saldo),
        perto: !r.bloqueado && saldo >= teto * AVISO_TAXAS_PCT,
      };
    },
    enabled: !!user && userTipo === "empresa",
  });
  return { ...query, resumo: query.data ?? VAZIO };
};

/** Histórico de taxas: contratações finalizadas da empresa. */
export const useHistoricoTaxas = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["taxas", "historico", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contratacoes")
        .select("*, jobs(*)")
        .eq("empresa_id", user!.id)
        .eq("status", "finalizada")
        .order("finalizada_em", { ascending: false });
      if (error) throw error;
      return data as ContratacaoComJob[];
    },
    enabled: !!user,
  });
};

const invalidarTaxas = (qc: ReturnType<typeof useQueryClient>) => {
  for (const k of ["taxas", "contratacoes", "contratacao", "notificacoes"]) qc.invalidateQueries({ queryKey: [k] });
};

/** Profissional confirma (ou contesta) o valor que recebeu. */
export const useConfirmarValor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { contratacaoId: string; confirma: boolean; valorRecebido?: number; motivo?: string }) => {
      const { data, error } = await supabase.rpc("confirmar_valor_contratacao", {
        p_id: input.contratacaoId,
        p_confirma: input.confirma,
        p_valor_recebido: input.valorRecebido,
        p_motivo: input.motivo,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => invalidarTaxas(qc),
  });
};

// ─────────────────────────────────────────────
// ADM
// ─────────────────────────────────────────────

export const useDivergencias = (enabled: boolean) => {
  return useQuery({
    queryKey: ["taxas", "divergencias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contratacoes")
        .select("*, jobs(*)")
        .eq("status_taxa", "em_divergencia")
        .order("finalizada_em", { ascending: true });
      if (error) throw error;
      return data as ContratacaoComJob[];
    },
    enabled,
  });
};

export const useSaldosEmpresas = (enabled: boolean) => {
  return useQuery({
    queryKey: ["taxas", "saldos-empresas"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_saldos_taxas");
      if (error) throw error;
      return data;
    },
    enabled,
  });
};

export const useResolverDivergencia = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ contratacaoId, valorFinal }: { contratacaoId: string; valorFinal: number }) => {
      const { error } = await supabase.rpc("admin_resolver_divergencia", { p_id: contratacaoId, p_valor_final: valorFinal });
      if (error) throw error;
    },
    onSuccess: () => invalidarTaxas(qc),
  });
};

export const useRegistrarPagamentoTaxas = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ empresaId, referencia }: { empresaId: string; referencia?: string }) => {
      const { data, error } = await supabase.rpc("admin_registrar_pagamento_taxas", { p_empresa: empresaId, p_referencia: referencia });
      if (error) throw error;
      return Number(data ?? 0);
    },
    onSuccess: () => invalidarTaxas(qc),
  });
};
