import { useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "./useAuth";
import { useMeuPerfil } from "./usePerfil";

export type DbSuporte = Tables<"suporte_mensagens">;

/** O usuário logado é ADM? (profiles.is_admin, definido via SQL) */
export const useIsAdmin = () => {
  const { data } = useMeuPerfil();
  return !!data?.profile.is_admin;
};

/** Conversa de suporte de um usuário (o próprio, ou qualquer um se for ADM). */
export const useSuporteConversa = (userId?: string) => {
  const queryClient = useQueryClient();
  const key = ["suporte", "conversa", userId];

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`suporte-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "suporte_mensagens", filter: `user_id=eq.${userId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["suporte"] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suporte_mensagens")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: true })
        .limit(500);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    refetchInterval: 20_000,
  });
};

export const useEnviarSuporte = (userId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const key = ["suporte", "conversa", userId];
  return useMutation({
    mutationFn: async (texto: string) => {
      if (!user || !userId) throw new Error("Faça login novamente");
      const { data, error } = await supabase
        .from("suporte_mensagens")
        .insert({ user_id: userId, autor_id: user.id, texto })
        .select()
        .single();
      if (error) {
        if (error.message.includes("suporte_mensagens")) throw new Error("Suporte indisponível: rode o SQL da Fase 3.");
        throw error;
      }
      return data;
    },
    onMutate: (texto) => {
      if (!user || !userId) return;
      const tmp: DbSuporte = {
        id: `tmp-${Date.now()}`, user_id: userId, autor_id: user.id, texto,
        lida_admin: false, lida_usuario: false, created_at: new Date().toISOString(),
      };
      queryClient.setQueryData<DbSuporte[]>(key, (a = []) => [...a, tmp]);
      return { tmpId: tmp.id };
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["suporte"] }),
    onError: (_e, _t, ctx) => queryClient.setQueryData<DbSuporte[]>(key, (a = []) => a.filter((m) => m.id !== ctx?.tmpId)),
  });
};

/** Marca como lidas as mensagens do outro lado (usuário: respostas da equipe; ADM: mensagens do usuário). */
export const useMarcarSuporteLido = (userId: string | undefined, mensagens: DbSuporte[], comoAdmin: boolean) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const pendentes = mensagens.filter((m) =>
    !m.id.startsWith("tmp-") && (comoAdmin ? m.autor_id === userId && !m.lida_admin : m.autor_id !== userId && !m.lida_usuario)
  ).length;

  useEffect(() => {
    if (!user || !userId || pendentes === 0) return;
    void (async () => {
      if (comoAdmin) {
        await supabase.from("suporte_mensagens").update({ lida_admin: true }).eq("user_id", userId).eq("lida_admin", false);
      } else {
        await supabase.from("suporte_mensagens").update({ lida_usuario: true }).eq("user_id", userId).eq("lida_usuario", false);
      }
      await supabase.from("notificacoes").update({ lida: true }).eq("user_id", user.id).eq("tipo", "suporte").eq("lida", false)
        .eq("link", comoAdmin ? `/admin/suporte/${userId}` : "/suporte");
      queryClient.invalidateQueries({ queryKey: ["suporte"] });
      queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
    })();
  }, [user, userId, pendentes, comoAdmin, queryClient]);
};

/** ADM: todas as conversas de suporte, agrupadas por usuário. */
export const useSuporteAtendimentos = (enabled: boolean) => {
  const query = useQuery({
    queryKey: ["suporte", "todas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suporte_mensagens")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(2000);
      if (error) throw error;
      return data;
    },
    enabled,
    refetchInterval: 30_000,
  });

  const conversas = useMemo(() => {
    const porUsuario = new Map<string, { userId: string; ultima: DbSuporte; naoLidas: number }>();
    for (const m of query.data ?? []) {
      const c = porUsuario.get(m.user_id);
      if (!c) porUsuario.set(m.user_id, { userId: m.user_id, ultima: m, naoLidas: 0 });
      const atual = porUsuario.get(m.user_id)!;
      if (m.autor_id === m.user_id && !m.lida_admin) atual.naoLidas++;
    }
    return Array.from(porUsuario.values());
  }, [query.data]);

  return { ...query, conversas };
};

/** Não lidas do suporte: para o usuário, respostas da equipe; para o ADM, mensagens de usuários. */
export const useSuporteNaoLidas = () => {
  const { user } = useAuth();
  const isAdmin = useIsAdmin();
  const { data = 0 } = useQuery({
    queryKey: ["suporte", "nao-lidas", user?.id, isAdmin],
    queryFn: async () => {
      let q = supabase.from("suporte_mensagens").select("id", { count: "exact", head: true });
      q = isAdmin ? q.eq("lida_admin", false) : q.eq("user_id", user!.id).eq("lida_usuario", false);
      const { count, error } = await q;
      if (error) return 0;
      return count ?? 0;
    },
    enabled: !!user,
    refetchInterval: 60_000,
  });
  return data;
};
