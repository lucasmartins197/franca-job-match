import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { mensagemTrava } from "./useTaxas";

/**
 * CÓDIGO DE CONFIRMAÇÃO CRUZADO (Fase 7) — prova de que o serviço aconteceu.
 *  1. Empresa marca o serviço como realizado e declara o valor → useGerarCodigo
 *     (o banco gera 4 dígitos que só a empresa vê: useMeuCodigo).
 *  2. A empresa passa o código ao profissional pessoalmente.
 *  3. O profissional digita → useConfirmarCodigo: contratação finalizada,
 *     taxa de 5% no saldo da empresa e avaliação obrigatória para os dois.
 * Tudo é validado no banco (SQL da Fase 7); 5 erros bloqueiam o código.
 */

export const MAX_TENTATIVAS_CODIGO = 5;

export type ResultadoCodigo = "confirmada" | "em_divergencia" | "incorreto" | "bloqueado";

const invalidar = (qc: ReturnType<typeof useQueryClient>) => {
  for (const k of ["contratacoes", "contratacao", "codigo", "pendencias", "taxas", "notificacoes", "my-jobs", "jobs", "job"]) {
    qc.invalidateQueries({ queryKey: [k] });
  }
};

const erroAmigavel = (error: { message: string }) => {
  if (error.message.includes("gerar_codigo_confirmacao") || error.message.includes("confirmar_codigo_contratacao")) {
    return new Error("Banco desatualizado: rode o SQL da Fase 7.");
  }
  return new Error(mensagemTrava(error) ?? error.message);
};

/** Código atual (só a empresa recebe; para o profissional volta null). */
export const useMeuCodigo = (contratacaoId?: string, enabled = true) =>
  useQuery({
    queryKey: ["codigo", contratacaoId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("meu_codigo_confirmacao", { p_id: contratacaoId! });
      if (error) return null;
      return data ?? null;
    },
    enabled: !!contratacaoId && enabled,
  });

/** Empresa: serviço realizado → declara o valor e gera (ou regenera) o código. */
export const useGerarCodigo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ contratacaoId, valor }: { contratacaoId: string; valor: number }) => {
      if (!Number.isFinite(valor) || valor <= 0) throw new Error("Informe o valor pago ao profissional");
      const { data, error } = await supabase.rpc("gerar_codigo_confirmacao", {
        p_id: contratacaoId,
        p_valor: Math.round(valor * 100) / 100,
      });
      if (error) throw erroAmigavel(error);
      return data;
    },
    onSuccess: (codigo, { contratacaoId }) => {
      qc.setQueryData(["codigo", contratacaoId], codigo);
      invalidar(qc);
    },
  });
};

/** Profissional: digita o código (e confirma ou contesta o valor declarado). */
export const useConfirmarCodigo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { contratacaoId: string; codigo: string; valorConfere: boolean; valorRecebido?: number; motivo?: string }) => {
      const { data, error } = await supabase.rpc("confirmar_codigo_contratacao", {
        p_id: input.contratacaoId,
        p_codigo: input.codigo,
        p_valor_confere: input.valorConfere,
        p_valor_recebido: input.valorConfere ? undefined : input.valorRecebido,
        p_motivo: input.valorConfere ? undefined : input.motivo,
      });
      if (error) throw erroAmigavel(error);
      return data as ResultadoCodigo;
    },
    onSuccess: () => invalidar(qc),
  });
};

/** ADM: encerra uma contratação travada (valor 0 = serviço não aconteceu, sem taxa). */
export const useAdminEncerrar = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ contratacaoId, valor }: { contratacaoId: string; valor: number }) => {
      const { error } = await supabase.rpc("admin_encerrar_contratacao", { p_id: contratacaoId, p_valor: valor });
      if (error) throw erroAmigavel(error);
    },
    onSuccess: () => invalidar(qc),
  });
};

// ─────────────────────────────────────────────
// Pendências (travas da Fase 7)
// ─────────────────────────────────────────────

export type TipoPendencia = "avaliar" | "digitar_codigo" | "aguardando_codigo" | "gerar_codigo" | "aguardando_profissional";

export interface Pendencia {
  tipo: TipoPendencia;
  contratacao_id: string;
  titulo: string;
  data: string;
  bloqueia: boolean;
}

/** O que falta o usuário fazer para fechar o ciclo (mesma regra das travas do banco). */
export const usePendencias = () => {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["pendencias", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("minhas_pendencias");
      if (error) {
        console.warn("minhas_pendencias indisponível — rode o SQL da Fase 7", error);
        return [] as Pendencia[];
      }
      return (data ?? []) as Pendencia[];
    },
    enabled: !!user,
    refetchInterval: 60000,
  });
  const lista = query.data ?? [];
  const avaliar = lista.filter((p) => p.tipo === "avaliar");
  const digitarCodigo = lista.filter((p) => p.tipo === "digitar_codigo");
  return {
    ...query,
    lista,
    avaliar,
    digitarCodigo,
    /** profissional: não pode se candidatar */
    bloqueiaCandidatura: avaliar.length > 0 || digitarCodigo.length > 0,
    /** primeira pendência que bloqueia (para o aviso) */
    principal: lista.find((p) => p.bloqueia) ?? null,
  };
};

/** Texto do aviso de cada pendência. */
export const textoPendencia = (p: Pendencia) => {
  switch (p.tipo) {
    case "avaliar": return { titulo: "Avalie o serviço", descricao: `“${p.titulo}” foi confirmado. A avaliação é obrigatória para continuar.`, acao: "Avaliar agora" };
    case "digitar_codigo": return { titulo: "Confirme o serviço com o código", descricao: `Peça à empresa o código de 4 dígitos de “${p.titulo}” e digite no app.`, acao: "Digitar código" };
    case "gerar_codigo": return { titulo: "O serviço já aconteceu?", descricao: `Marque “${p.titulo}” como realizado para gerar o código de confirmação.`, acao: "Gerar código" };
    case "aguardando_profissional": return { titulo: "Passe o código ao profissional", descricao: `Falta o profissional digitar o código de “${p.titulo}”.`, acao: "Ver código" };
    default: return { titulo: "Serviço agendado", descricao: `“${p.titulo}”: no dia, a empresa vai te passar um código para confirmar.`, acao: "Ver detalhes" };
  }
};
