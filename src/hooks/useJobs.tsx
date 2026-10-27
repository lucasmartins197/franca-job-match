import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { useAuth } from "./useAuth";
import { mensagemTrava } from "./useTaxas";

export type DbJob = Tables<"jobs">;
export type DbApplication = Tables<"applications">;

export const JOB_STATUS_LABEL: Record<string, string> = {
  aberta: "Aberta",
  preenchida: "Preenchida",
  finalizada: "Finalizada",
  cancelada: "Cancelada",
};

export const APPLICATION_STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  aceita: "Aceita",
  recusada: "Recusada",
};

const todayISO = () => {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

/** Feed do profissional: vagas abertas, de hoje em diante. */
export const useJobs = () => {
  return useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("status", "aberta")
        .gte("date", todayISO())
        .order("date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
};

export const useJob = (id?: string) => {
  return useQuery({
    queryKey: ["job", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("jobs").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

export const useMyJobs = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-jobs", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useCreateJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (job: TablesInsert<"jobs">) => {
      // TRAVA: confere de novo no momento de publicar (o botão já fica bloqueado na tela)
      const { count, error: travaError } = await supabase
        .from("contratacoes")
        .select("id", { count: "exact", head: true })
        .eq("empresa_id", job.user_id)
        .eq("status", "em_andamento");
      if (travaError) throw travaError;
      if ((count ?? 0) > 0) {
        throw new Error("Confirme o serviço em andamento com o código antes de criar uma nova vaga.");
      }

      let { data, error } = await supabase.from("jobs").insert(job).select().single();
      // banco sem o SQL da Fase 8 (colunas de mapa): publica sem as coordenadas
      if (error && /latitude|longitude/.test(error.message)) {
        const { latitude: _lat, longitude: _lon, ...semMapa } = job;
        ({ data, error } = await supabase.from("jobs").insert(semMapa).select().single());
      }
      if (error) throw new Error(mensagemTrava(error) ?? error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["my-jobs"] });
    },
  });
};

export const useApply = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ jobId, userId }: { jobId: string; userId: string }) => {
      const { error } = await supabase.from("applications").insert({ job_id: jobId, user_id: userId });
      if (error) {
        if (error.code === "23505") throw new Error("Você já se candidatou a esta vaga.");
        throw new Error(mensagemTrava(error) ?? error.message);
      }
      // A notificação para a empresa é criada pelo trigger frela_on_application_insert.
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-applications"] });
    },
    onError: () => queryClient.invalidateQueries({ queryKey: ["pendencias"] }),
  });
};

/** Candidaturas do profissional logado, com a vaga de cada uma. */
export const useMyApplications = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-applications", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("applications")
        .select("*, jobs(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useJobApplications = (jobId?: string) => {
  return useQuery({
    queryKey: ["job-applications", jobId],
    queryFn: async () => {
      if (!jobId) return [];
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .eq("job_id", jobId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!jobId,
  });
};

/** Empresa cancela uma vaga ABERTA. O banco recusa as candidaturas pendentes e avisa os candidatos. */
export const useCancelarVaga = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (jobId: string) => {
      const { data, error } = await supabase
        .from("jobs")
        .update({ status: "cancelada", slots_remaining: 0 })
        .eq("id", jobId)
        .eq("status", "aberta")
        .select("id");
      if (error) throw error;
      if (!data?.length) throw new Error("Só é possível cancelar vagas abertas.");
    },
    onSuccess: () => {
      for (const k of ["jobs", "job", "my-jobs", "job-applications"]) queryClient.invalidateQueries({ queryKey: [k] });
    },
  });
};
