import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface DbJob {
  id: string;
  user_id: string;
  company_name: string;
  title: string;
  category: string;
  skill: string;
  description: string;
  date: string;
  time_start: string;
  time_end: string;
  payment: number;
  slots: number;
  slots_remaining: number;
  neighborhood: string;
  address: string;
  status: string;
  created_at: string;
}

export const useJobs = () => {
  return useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as DbJob[];
    },
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
      return data as DbJob[];
    },
    enabled: !!user,
  });
};

export const useCreateJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (job: Omit<DbJob, "id" | "created_at">) => {
      const { data, error } = await supabase.from("jobs").insert(job).select().single();
      if (error) throw error;
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
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-applications"] });
    },
  });
};

export const useMyApplications = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-applications", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("applications")
        .select("job_id")
        .eq("user_id", user.id);
      if (error) throw error;
      return data.map((a) => a.job_id);
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
        .eq("job_id", jobId);
      if (error) throw error;
      return data;
    },
    enabled: !!jobId,
  });
};
