import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useMyJobs } from "@/hooks/useJobs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PostJobTab from "@/components/PostJobTab";
import { Plus, LogOut, Users, Briefcase, TrendingUp, Loader2 } from "lucide-react";

const Dashboard = () => {
  const { user, signOut, userTipo } = useAuth();
  const navigate = useNavigate();
  const { data: myJobs = [], isLoading } = useMyJobs();
  const [showPostModal, setShowPostModal] = useState(false);

  if (userTipo === "freelancer") {
    navigate("/", { replace: true });
    return null;
  }

  const nome = user?.user_metadata?.nome || "Empresa";
  const activeJobs = myJobs.filter((j) => j.status === "aberta");

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="px-5 pt-12 pb-6 flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">Painel da Empresa</p>
          <h1 className="text-2xl font-display font-bold text-foreground">Olá, {nome.split(" ")[0]}</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowPostModal(true)}
            className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center shadow-gold">
            <Plus className="h-5 w-5 text-background" />
          </button>
          <button onClick={handleSignOut}
            className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center">
            <LogOut className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="px-5 grid grid-cols-3 gap-3 mb-8">
        {[
          { label: "Vagas Ativas", value: activeJobs.length, icon: Briefcase },
          { label: "Total Vagas", value: myJobs.length, icon: TrendingUp },
          { label: "Candidatos", value: "—", icon: Users },
        ].map((m) => (
          <div key={m.label} className="bg-card rounded-xl p-4 border border-border text-center">
            <m.icon className="h-5 w-5 text-gold mx-auto mb-2" />
            <div className="text-xl font-display font-bold text-foreground">{m.value}</div>
            <div className="text-[10px] text-muted-foreground">{m.label}</div>
          </div>
        ))}
      </div>

      <div className="px-5">
        <h2 className="font-display font-bold text-foreground mb-4">Suas Vagas</h2>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-gold" /></div>
        ) : myJobs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Nenhuma vaga publicada ainda</p>
            <Button onClick={() => setShowPostModal(true)} className="gradient-gold text-background rounded-xl font-display font-bold shadow-gold">
              <Plus className="h-4 w-4 mr-2" /> Publicar primeira vaga
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {myJobs.map((job) => (
              <div key={job.id} className="bg-card rounded-xl p-4 border border-border">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-display font-bold text-foreground">{job.title}</h3>
                    <span className="text-xs text-muted-foreground">{job.category}</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                    job.status === "aberta" ? "bg-success/10 text-success" :
                    job.status === "em_andamento" ? "bg-gold/10 text-gold" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {job.status === "aberta" ? "Aberta" : job.status === "em_andamento" ? "Em Andamento" : "Finalizada"}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="font-display font-bold text-gold">R${job.payment}</span>
                  <Button size="sm" variant="outline" onClick={() => navigate(`/job/${job.id}/candidates`)}
                    className="h-8 rounded-lg border-border text-muted-foreground hover:text-foreground text-xs">
                    <Users className="h-3.5 w-3.5 mr-1" /> Ver Candidatos
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={() => setShowPostModal(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-xl gradient-gold flex items-center justify-center shadow-gold z-50">
        <Plus className="h-6 w-6 text-background" />
      </button>

      <Dialog open={showPostModal} onOpenChange={setShowPostModal}>
        <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-foreground">Nova Vaga</DialogTitle>
          </DialogHeader>
          <PostJobTab onClose={() => setShowPostModal(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
