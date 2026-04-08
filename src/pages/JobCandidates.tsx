import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useJobApplications } from "@/hooks/useJobs";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const JobCandidates = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: applications = [], isLoading } = useJobApplications(id);
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAction = async (appId: string, status: "aceita" | "recusada") => {
    setProcessingId(appId);
    const { error } = await supabase.from("applications").update({ status }).eq("id", appId);
    setProcessingId(null);
    if (error) { toast.error("Erro ao processar"); return; }
    toast.success(status === "aceita" ? "Candidato aceito!" : "Candidato recusado");
    queryClient.invalidateQueries({ queryKey: ["job-applications", id] });
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="px-5 pt-12 pb-6 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center shadow-sm">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="font-display font-bold text-foreground">Candidatos</h1>
      </div>

      <div className="px-5 space-y-3">
        {isLoading && <p className="text-muted-foreground text-center py-8">Carregando...</p>}
        {!isLoading && applications.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Nenhum candidato ainda</p>
          </div>
        )}
        {applications.map((app: any) => (
          <div key={app.id} className="bg-card rounded-xl p-4 border border-border flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl gradient-brand flex items-center justify-center text-lg font-display font-bold text-primary-foreground shrink-0">
              {(app.user_id || "?").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-foreground text-sm truncate">Candidato</p>
              <div className="flex items-center gap-1 mt-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`h-3 w-3 ${s <= 4 ? "fill-amber-400 text-amber-400" : "text-border"}`} />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Status: <span className={app.status === "aceita" ? "text-green-600" : app.status === "recusada" ? "text-destructive" : "text-primary"}>{app.status}</span>
              </p>
            </div>
            {app.status === "pendente" && (
              <div className="flex gap-2 shrink-0">
                <Button size="sm" onClick={() => handleAction(app.id, "aceita")} disabled={processingId === app.id}
                  className="h-9 px-3 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 border-0">
                  {processingId === app.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleAction(app.id, "recusada")} disabled={processingId === app.id}
                  className="h-9 px-3 rounded-lg border-destructive/30 text-destructive hover:bg-destructive/10">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default JobCandidates;
