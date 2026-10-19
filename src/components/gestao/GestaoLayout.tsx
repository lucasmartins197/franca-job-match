import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { ArrowLeft, BarChart3, Building2, Loader2, Rocket, ShieldAlert, Users, Wallet, Wrench } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useMeuPerfil } from "@/hooks/usePerfil";
import { GestaoContext } from "@/hooks/useGestao";
import Logo from "@/components/frela/Logo";
import EmptyState from "@/components/frela/EmptyState";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/gestao", end: true, label: "Visão geral", icon: BarChart3 },
  { to: "/gestao/financeiro", label: "Financeiro", icon: Wallet },
  { to: "/gestao/empresas", label: "Empresas", icon: Building2 },
  { to: "/gestao/profissionais", label: "Profissionais", icon: Users },
  { to: "/gestao/crescimento", label: "Crescimento", icon: Rocket },
  { to: "/gestao/operacao", label: "Operação", icon: Wrench },
];

const lerDemo = () => {
  try {
    return localStorage.getItem("frela-gestao-demo") !== "0";
  } catch {
    return true;
  }
};

/** Backoffice do ADM: só para profiles.is_admin = true. */
const GestaoLayout = () => {
  const navigate = useNavigate();
  const { data: perfil, isLoading } = useMeuPerfil();
  const [incluirDemo, setDemo] = useState(lerDemo);

  const setIncluirDemo = (v: boolean) => {
    setDemo(v);
    try {
      localStorage.setItem("frela-gestao-demo", v ? "1" : "0");
    } catch {
      /* sem storage: só não lembra a escolha */
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!perfil?.profile.is_admin) {
    return (
      <div className="min-h-screen bg-background">
        <EmptyState icon={ShieldAlert} titulo="Área restrita à equipe FreLa" descricao="O painel de gestão é só para administradores."
          acao={<button onClick={() => navigate("/")} className="text-sm font-semibold text-primary">Voltar ao app</button>} />
      </div>
    );
  }

  return (
    <GestaoContext.Provider value={{ incluirDemo, setIncluirDemo }}>
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-border">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 h-14 flex items-center gap-3">
            <button onClick={() => navigate("/")}
              className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-border bg-card text-sm font-semibold text-foreground hover:bg-muted">
              <ArrowLeft className="h-4 w-4" /> Voltar ao app
            </button>
            <span className="hidden sm:inline-flex"><Logo size="sm" /></span>
            <span className="text-sm font-semibold text-muted-foreground border-l border-border pl-3">Gestão</span>
            <label className="ml-auto flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <Switch checked={incluirDemo} onCheckedChange={setIncluirDemo} aria-label="Incluir dados demo" />
              <span className="hidden sm:inline">Incluir dados demo</span><span className="sm:hidden">Demo</span>
            </label>
          </div>
          <nav className="lg:hidden flex gap-1 overflow-x-auto no-scrollbar px-3 pb-2">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end}
                className={({ isActive }) => cn("shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold",
                  isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                <n.icon className="h-3.5 w-3.5" /> {n.label}
              </NavLink>
            ))}
          </nav>
        </header>
        <div className="max-w-7xl mx-auto lg:flex lg:gap-6 lg:px-6">
          <aside className="hidden lg:block w-52 shrink-0 pt-6">
            <nav className="sticky top-20 space-y-1">
              {NAV.map((n) => (
                <NavLink key={n.to} to={n.to} end={n.end}
                  className={({ isActive }) => cn("flex items-center gap-2.5 h-10 px-3 rounded-xl text-sm font-medium",
                    isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted")}>
                  <n.icon className="h-4 w-4" /> {n.label}
                </NavLink>
              ))}
            </nav>
          </aside>
          <main className="flex-1 min-w-0 px-4 lg:px-0 py-5 lg:py-6 pb-16">
            <Outlet />
          </main>
        </div>
      </div>
    </GestaoContext.Provider>
  );
};

export default GestaoLayout;
