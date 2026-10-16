import { useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "./useAuth";
import { ContratacaoComJob, useMinhasContratacoes } from "./useFrela";

export type DbMensagem = Tables<"mensagens">;

export interface Conversa {
  contratacao: ContratacaoComJob;
  outroId: string;
  ultima: DbMensagem | null;
  naoLidas: number;
  atividade: string;
}

/** Todas as minhas mensagens (para montar a lista de conversas). */
const useMinhasMensagens = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["mensagens", "todas", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mensagens")
        .select("*")
        .or(`de_id.eq.${user!.id},para_id.eq.${user!.id}`)
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

/** Escuta mensagens novas/lidas que me envolvem e atualiza as telas. */
export const useChatRealtime = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!user) return;
    const refresh = () => queryClient.invalidateQueries({ queryKey: ["mensagens"] });
    const channel = supabase
      .channel(`chat-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "mensagens", filter: `para_id=eq.${user.id}` }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "mensagens", filter: `de_id=eq.${user.id}` }, refresh)
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, queryClient]);
};

export const useConversas = () => {
  const { user } = useAuth();
  const { data: contratacoes = [], isLoading: l1 } = useMinhasContratacoes();
  const { data: mensagens = [], isLoading: l2 } = useMinhasMensagens();

  const conversas = useMemo<Conversa[]>(() => {
    if (!user) return [];
    return contratacoes
      .map((c) => {
        const daConversa = mensagens.filter((m) => m.contratacao_id === c.id);
        const ultima = daConversa[0] ?? null;
        return {
          contratacao: c,
          outroId: c.empresa_id === user.id ? c.profissional_id : c.empresa_id,
          ultima,
          naoLidas: daConversa.filter((m) => m.para_id === user.id && !m.lida).length,
          atividade: ultima?.created_at ?? c.created_at,
        };
      })
      .sort((a, b) => b.atividade.localeCompare(a.atividade));
  }, [contratacoes, mensagens, user]);

  return { conversas, isLoading: l1 || l2 };
};

/** Total de mensagens não lidas (badge da aba Chat). */
export const useChatNaoLidas = () => {
  const { user } = useAuth();
  const { data = 0 } = useQuery({
    queryKey: ["mensagens", "nao-lidas", user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("mensagens")
        .select("id", { count: "exact", head: true })
        .eq("para_id", user!.id)
        .eq("lida", false);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user,
    refetchInterval: 60_000,
  });
  return data;
};

export const useMensagens = (contratacaoId?: string) => {
  const queryClient = useQueryClient();
  const key = ["mensagens", "conversa", contratacaoId];

  useEffect(() => {
    if (!contratacaoId) return;
    const channel = supabase
      .channel(`conversa-${contratacaoId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mensagens", filter: `contratacao_id=eq.${contratacaoId}` },
        (payload) => {
          const nova = payload.new as DbMensagem;
          queryClient.setQueryData<DbMensagem[]>(key, (antigas = []) =>
            antigas.some((m) => m.id === nova.id) ? antigas : [...antigas.filter((m) => !m.id.startsWith("tmp-") || m.texto !== nova.texto), nova]
          );
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contratacaoId, queryClient]);

  return useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mensagens")
        .select("*")
        .eq("contratacao_id", contratacaoId!)
        .order("created_at", { ascending: true })
        .limit(500);
      if (error) throw error;
      return data;
    },
    enabled: !!contratacaoId,
    // fallback caso o realtime não esteja ligado no projeto
    refetchInterval: 15_000,
  });
};

export const useEnviarMensagem = (contratacao?: ContratacaoComJob | null) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const key = ["mensagens", "conversa", contratacao?.id];

  return useMutation({
    mutationFn: async (texto: string) => {
      if (!user || !contratacao) throw new Error("Conversa indisponível");
      const paraId = user.id === contratacao.empresa_id ? contratacao.profissional_id : contratacao.empresa_id;
      const { data, error } = await supabase
        .from("mensagens")
        .insert({ contratacao_id: contratacao.id, de_id: user.id, para_id: paraId, texto })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onMutate: async (texto) => {
      // otimista: a mensagem aparece na hora, antes da resposta do servidor
      if (!user || !contratacao) return;
      const tmp: DbMensagem = {
        id: `tmp-${Date.now()}`,
        contratacao_id: contratacao.id,
        de_id: user.id,
        para_id: user.id === contratacao.empresa_id ? contratacao.profissional_id : contratacao.empresa_id,
        texto,
        lida: false,
        created_at: new Date().toISOString(),
      };
      queryClient.setQueryData<DbMensagem[]>(key, (antigas = []) => [...antigas, tmp]);
      return { tmpId: tmp.id };
    },
    onSuccess: (nova, _texto, ctx) => {
      queryClient.setQueryData<DbMensagem[]>(key, (antigas = []) => {
        const semTmp = antigas.filter((m) => m.id !== ctx?.tmpId);
        return semTmp.some((m) => m.id === nova.id) ? semTmp : [...semTmp, nova];
      });
      queryClient.invalidateQueries({ queryKey: ["mensagens", "todas"] });
    },
    onError: (_err, _texto, ctx) => {
      queryClient.setQueryData<DbMensagem[]>(key, (antigas = []) => antigas.filter((m) => m.id !== ctx?.tmpId));
    },
  });
};

/** Marca como lidas as mensagens recebidas nesta conversa (e a notificação dela). */
export const useMarcarConversaLida = (contratacaoId: string | undefined, mensagens: DbMensagem[]) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const pendentes = mensagens.filter((m) => m.para_id === user?.id && !m.lida && !m.id.startsWith("tmp-")).length;

  useEffect(() => {
    if (!user || !contratacaoId || pendentes === 0) return;
    void (async () => {
      await supabase
        .from("mensagens")
        .update({ lida: true })
        .eq("contratacao_id", contratacaoId)
        .eq("para_id", user.id)
        .eq("lida", false);
      await supabase
        .from("notificacoes")
        .update({ lida: true })
        .eq("user_id", user.id)
        .eq("tipo", "mensagem")
        .eq("link", `/chat/${contratacaoId}`)
        .eq("lida", false);
      queryClient.invalidateQueries({ queryKey: ["mensagens"] });
      queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
    })();
  }, [user, contratacaoId, pendentes, queryClient]);
};
