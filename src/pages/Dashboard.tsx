import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Plus, BarChart3, Users } from "lucide-react";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto pb-8">
      <div className="bg-gradient-hero px-5 pt-12 pb-8 rounded-b-3xl">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-extrabold text-primary-foreground">ELOOPS</h1>
          <button
            onClick={handleSignOut}
            className="w-10 h-10 bg-primary-foreground/15 rounded-xl flex items-center justify-center"
          >
            <LogOut className="h-5 w-5 text-primary-foreground" />
          </button>
        </div>
        <p className="text-primary-foreground/70 text-sm">Painel da Empresa</p>
      </div>

      <div className="px-5 mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Vagas ativas", value: "0", icon: Plus, emoji: "📋" },
            { label: "Candidatos", value: "0", icon: Users, emoji: "👥" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card rounded-2xl p-4 border border-border/50 shadow-card">
              <div className="text-2xl mb-1">{stat.emoji}</div>
              <div className="text-2xl font-extrabold text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        <Button
          onClick={() => navigate("/")}
          className="w-full h-14 rounded-2xl bg-gradient-brand text-primary-foreground font-bold text-lg shadow-brand"
          size="lg"
        >
          <Plus className="mr-2 h-5 w-5" />
          Publicar vaga
        </Button>

        <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-card text-center">
          <div className="text-4xl mb-3">🚀</div>
          <h3 className="font-bold text-foreground mb-1">Comece agora</h3>
          <p className="text-sm text-muted-foreground">Publique sua primeira vaga e encontre profissionais qualificados.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
