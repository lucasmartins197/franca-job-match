import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, Calendar, Building2, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useJobs, useApply, useMyApplications } from "@/hooks/useJobs";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: jobs } = useJobs();
  const applyMutation = useApply();
  const { data: myApplications = [] } = useMyApplications();
  const [justApplied, setJustApplied] = useState(false);

  const job = jobs?.find((j) => j.id === id);
  if (!job) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground">Carregando...</p>
    </div>
  );

  const applied = myApplications.includes(job.id) || justApplied;

  const handleApply = async () => {
    if (!user) return;
    try {
      await applyMutation.mutateAsync({ jobId: job.id, userId: user.id });
      setJustApplied(true);
      toast.success("Candidatura enviada!");
    } catch {
      toast.error("Erro ao candidatar-se");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-5 pt-12 pb-6 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center shadow-sm">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="font-display font-bold text-foreground">Detalhes da Vaga</h1>
      </div>

      <div className="px-5">
        <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center text-2xl font-display font-bold text-primary-foreground mb-4">
          {job.company_name.charAt(0)}
        </div>

        <h2 className="text-2xl font-display font-bold text-foreground mb-1">{job.title}</h2>
        <div className="flex items-center gap-2 text-muted-foreground mb-4">
          <Building2 className="h-4 w-4" />
          <span>{job.company_name}</span>
        </div>

        <span className="inline-block px-3 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary mb-6">
          {job.category}
        </span>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { icon: Calendar, label: "Data", value: new Date(job.date).toLocaleDateString("pt-BR") },
            { icon: Clock, label: "Horário", value: `${job.time_start} – ${job.time_end}` },
            { icon: MapPin, label: "Local", value: job.address || job.neighborhood },
          ].map((item) => (
            <div key={item.label} className="bg-card rounded-xl p-3 border border-border shadow-sm">
              <div className="flex items-center gap-1.5 mb-1">
                <item.icon className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs text-muted-foreground">{item.label}</span>
              </div>
              <span className="text-sm font-medium text-foreground">{item.value}</span>
            </div>
          ))}
          <div className="bg-card rounded-xl p-3 border border-primary/20 shadow-sm">
            <span className="text-xs text-muted-foreground block mb-1">Pagamento</span>
            <span className="text-lg font-display font-bold text-primary">R${job.payment}</span>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-display font-bold text-foreground mb-2">Descrição</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{job.description || "Sem descrição fornecida."}</p>
        </div>

        <div className="bg-card rounded-xl p-4 border border-border mb-6 shadow-sm">
          <h3 className="font-display font-bold text-foreground mb-2">Sobre a Empresa</h3>
          <p className="text-sm text-muted-foreground">{job.company_name} — Franca, SP</p>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-5 bg-background/95 backdrop-blur-lg border-t border-border">
        {applied ? (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center justify-center gap-2 h-14">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <span className="font-display font-bold text-success">Candidatura Enviada ✓</span>
          </motion.div>
        ) : (
          <Button onClick={handleApply} disabled={applyMutation.isPending}
            className="w-full h-14 rounded-xl gradient-brand text-primary-foreground font-display font-bold text-lg shadow-brand hover:opacity-90 transition-opacity">
            {applyMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Candidatar-se"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default JobDetail;
