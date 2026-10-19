import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const STATUS_INDICACAO: Record<string, { label: string; descricao: string; cls: string }> = {
  pendente: { label: "Criou conta", descricao: "Ainda completando o perfil", cls: "bg-muted text-muted-foreground" },
  cadastrou: { label: "Cadastrou", descricao: "Perfil completo — falta assinar", cls: "bg-sky-100 text-sky-800" },
  pagou: { label: "Assinou", descricao: "Assinatura ativa", cls: "bg-amber-100 text-amber-800" },
  recompensado: { label: "Você ganhou!", descricao: "Desconto creditado nas suas taxas", cls: "bg-emerald-100 text-emerald-800" },
};

export const linkIndicacao = (codigo: string) => `${window.location.origin}/auth?indicacao=${encodeURIComponent(codigo)}`;

export const useMinhasIndicacoes = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["indicacoes", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("minhas_indicacoes");
      if (error) {
        console.warn("minhas_indicacoes indisponível — rode o SQL da Fase 6", error);
        return [];
      }
      return data.map((d) => ({ ...d, recompensa_valor: d.recompensa_valor == null ? null : Number(d.recompensa_valor) }));
    },
    enabled: !!user,
  });
};

/** Créditos de taxas (ex.: recompensas de indicação). */
export const useCreditosTaxas = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["creditos", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("creditos_taxas").select("*").eq("empresa_id", user!.id).order("created_at", { ascending: false });
      if (error) return [];
      return data.map((c) => ({ ...c, valor: Number(c.valor), saldo: Number(c.saldo) }));
    },
    enabled: !!user,
  });
};
