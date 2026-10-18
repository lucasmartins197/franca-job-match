import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "./useAuth";
import type { DbApplication, DbJob } from "./useJobs";

export type DbProfile = Tables<"profiles">;
export type DbContratacao = Tables<"contratacoes">;
export type DbAvaliacao = Tables<"avaliacoes">;
export type DbNotificacao = Tables<"notificacoes">;

import { TAXA_PLATAFORMA } from "@/lib/pagamentos";
import { useResumoTaxas } from "./useTaxas";
export { TAXA_PLATAFORMA };

export const formatBRL = (valor: number | null | undefined) =>
  (valor ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const formatDate = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR");

// ─────────────────────────────────────────────
// Perfis
// ─────────────────────────────────────────────

export const useMyProfile = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

/** Busca vários perfis de uma vez e devolve um mapa id → perfil. */
export const useProfilesByIds = (ids: string[]) => {
  const unique = Array.from(new Set(ids)).sort();
  return useQuery({
    queryKey: ["profiles", unique],
    queryFn: async () => {
      if (unique.length === 0) return {} as Record<string, DbProfile>;
      const { data, error } = await supabase.from("profiles").select("*").in("id", unique);
      if (error) throw error;
      return Object.fromEntries(data.map((p) => [p.id, p])) as Record<string, DbProfile>;
    },
    enabled: unique.length > 0,
  });
};

// ─────────────────────────────────────────────
// Contratações
// ─────────────────────────────────────────────

export type ContratacaoComJob = DbContratacao & { jobs: DbJob | null };

/** Todas as contratações em que o usuário logado é parte (empresa ou profissional). */
export const useMinhasContratacoes = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["contratacoes", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contratacoes")
        .select("*, jobs(*)")
        .or(`empresa_id.eq.${user!.id},profissional_id.eq.${user!.id}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ContratacaoComJob[];
    },
    enabled: !!user,
  });
};

export const useContratacao = (id?: string) => {
  return useQuery({
    queryKey: ["contratacao", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contratacoes")
        .select("*, jobs(*)")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data as ContratacaoComJob | null;
    },
    enabled: !!id,
  });
};

/**
 * TRAVAS para criar vaga:
 *  • contratação em andamento (precisa confirmar a finalização)
 *  • saldo de taxas >= teto (precisa quitar) — Fase 4
 * (as duas também são garantidas no banco)
 */
export const useTravaNovaVaga = () => {
  const { data: contratacoes = [], isLoading } = useMinhasContratacoes();
  const { resumo } = useResumoTaxas();
  const { user } = useAuth();
  const pendentes = contratacoes.filter((c) => c.empresa_id === user?.id && c.status === "em_andamento");
  const motivo: "taxas" | "contratacao" | null = resumo.bloqueado ? "taxas" : pendentes.length > 0 ? "contratacao" : null;
  return { bloqueado: motivo !== null, motivo, pendentes, taxasBloqueadas: resumo.bloqueado, isLoading };
};

const invalidateFluxo = (queryClient: ReturnType<typeof useQueryClient>) => {
  for (const key of ["contratacoes", "contratacao", "my-jobs", "jobs", "job", "job-applications", "my-applications"]) {
    queryClient.invalidateQueries({ queryKey: [key] });
  }
};

/**
 * Empresa aceita um candidato:
 *  1. cria a contratação (em_andamento, taxa_5pct = valor * 0.05)
 *  2. candidatura → 'aceita' (as outras pendentes da vaga → 'recusada')
 *  3. vaga → 'preenchida'
 * A notificação "você foi confirmado" é criada pelo trigger frela_on_contratacao_change.
 */
export const useAceitarCandidato = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ application, job }: { application: DbApplication; job: DbJob }) => {
      if (!user) throw new Error("Faça login novamente");
      if (job.status !== "aberta") throw new Error("Esta vaga não está mais aberta.");

      const { count, error: existeError } = await supabase
        .from("contratacoes")
        .select("id", { count: "exact", head: true })
        .eq("job_id", job.id);
      if (existeError) throw existeError;
      if ((count ?? 0) > 0) throw new Error("Esta vaga já tem um profissional confirmado.");

      const valor = Number(job.payment);
      const { data: contratacao, error: contratacaoError } = await supabase
        .from("contratacoes")
        .insert({
          job_id: job.id,
          empresa_id: user.id,
          profissional_id: application.user_id,
          valor,
          status: "em_andamento",
          taxa_5pct: Math.round(valor * TAXA_PLATAFORMA * 100) / 100,
        })
        .select()
        .single();
      if (contratacaoError) throw contratacaoError;

      const { error: appError } = await supabase
        .from("applications")
        .update({ status: "aceita" })
        .eq("id", application.id);
      if (appError) throw appError;

      const { error: outrasError } = await supabase
        .from("applications")
        .update({ status: "recusada" })
        .eq("job_id", job.id)
        .eq("status", "pendente");
      if (outrasError) throw outrasError;

      const { error: jobError } = await supabase
        .from("jobs")
        .update({ status: "preenchida", slots_remaining: 0 })
        .eq("id", job.id);
      if (jobError) throw jobError;

      return contratacao;
    },
    onSuccess: () => invalidateFluxo(queryClient),
  });
};

export const useRecusarCandidato = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (applicationId: string) => {
      const { error } = await supabase.from("applications").update({ status: "recusada" }).eq("id", applicationId);
      if (error) throw error;
    },
    onSuccess: () => invalidateFluxo(queryClient),
  });
};

/** Empresa confirma que o serviço foi realizado. */
/**
 * Passo 1 da finalização: a empresa confirma o serviço e DECLARA o valor pago.
 * O banco calcula a taxa (5% do valor declarado), deixa status_taxa = 'pendente'
 * e notifica o profissional para confirmar o valor (passo 2: useConfirmarValor).
 * Trava: com saldo de taxas >= teto o banco recusa (TRAVA_TAXAS).
 * Cobrança da taxa: ver src/lib/pagamentos.ts (acumula e é quitada depois).
 */
export const useFinalizarContratacao = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ contratacao, valor }: { contratacao: DbContratacao; valor: number }) => {
      if (!Number.isFinite(valor) || valor <= 0) throw new Error("Informe o valor pago ao profissional");
      const { error } = await supabase
        .from("contratacoes")
        .update({ status: "finalizada", valor: Math.round(valor * 100) / 100, finalizada_em: new Date().toISOString() })
        .eq("id", contratacao.id)
        .eq("status", "em_andamento");
      if (error) throw error;

      const { error: jobError } = await supabase
        .from("jobs")
        .update({ status: "finalizada" })
        .eq("id", contratacao.job_id);
      if (jobError) throw jobError;
    },
    onSuccess: () => {
      invalidateFluxo(queryClient);
      queryClient.invalidateQueries({ queryKey: ["taxas"] });
    },
  });
};

// ─────────────────────────────────────────────
// Avaliações
// ─────────────────────────────────────────────

export const useAvaliacoesDaContratacao = (contratacaoId?: string) => {
  return useQuery({
    queryKey: ["avaliacoes", contratacaoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("avaliacoes")
        .select("*")
        .eq("contratacao_id", contratacaoId!);
      if (error) throw error;
      return data;
    },
    enabled: !!contratacaoId,
  });
};

export const useAvaliacoesRecebidas = (userId?: string) => {
  return useQuery({
    queryKey: ["avaliacoes-recebidas", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("avaliacoes")
        .select("*")
        .eq("para_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

/** IDs das contratações que o usuário logado já avaliou. */
export const useAvaliacoesFeitas = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["avaliacoes", "feitas", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("avaliacoes").select("contratacao_id").eq("de_id", user!.id);
      if (error) throw error;
      return data.map((a) => a.contratacao_id);
    },
    enabled: !!user,
  });
};

/** A média/total no perfil de quem recebeu é atualizada pelo trigger frela_after_avaliacao_insert. */
export const useAvaliar = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { contratacao: DbContratacao; nota: number; comentario: string }) => {
      if (!user) throw new Error("Faça login novamente");
      const { contratacao, nota, comentario } = input;
      const paraId = user.id === contratacao.empresa_id ? contratacao.profissional_id : contratacao.empresa_id;
      const { error } = await supabase.from("avaliacoes").insert({
        contratacao_id: contratacao.id,
        de_id: user.id,
        para_id: paraId,
        nota,
        comentario: comentario.trim() || null,
      });
      if (error) {
        if (error.code === "23505") throw new Error("Você já avaliou esta contratação.");
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["avaliacoes"] });
      queryClient.invalidateQueries({ queryKey: ["avaliacoes-recebidas"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
    },
  });
};

// ─────────────────────────────────────────────
// Notificações
// ─────────────────────────────────────────────

export const useNotificacoes = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notificacoes-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notificacoes", filter: `user_id=eq.${user.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["notificacoes", user.id] });
          // uma notificação nova quase sempre significa mudança no fluxo
          invalidateFluxo(queryClient);
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return useQuery({
    queryKey: ["notificacoes", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notificacoes")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
};

export const useMarcarNotificacaoLida = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (id: string | "todas") => {
      let query = supabase.from("notificacoes").update({ lida: true }).eq("user_id", user!.id);
      query = id === "todas" ? query.eq("lida", false) : query.eq("id", id);
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notificacoes"] }),
  });
};
