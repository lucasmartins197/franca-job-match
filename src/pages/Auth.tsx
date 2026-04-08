import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, Users, ArrowLeft, Loader2 } from "lucide-react";
import OnboardingScreen from "@/components/OnboardingScreen";
import { useAuth } from "@/hooks/useAuth";

type Step = "onboarding" | "choose" | "signup" | "login";
type UserTipo = "freelancer" | "empresa";

const normalizeUserTipo = (value: unknown): UserTipo | null => {
  if (value === "freelancer" || value === "empresa") {
    return value;
  }

  return null;
};

const getRedirectPath = (tipo: UserTipo) => {
  return tipo === "empresa" ? "/dashboard" : "/";
};

const Auth = () => {
  const navigate = useNavigate();
  const { session, userTipo, loading: authLoading } = useAuth();
  const [step, setStep] = useState<Step>("onboarding");
  const [tipo, setTipo] = useState<UserTipo>("freelancer");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState<UserTipo | null>(null);

  useEffect(() => {
    if (authLoading || !session) {
      return;
    }

    const redirectTipo = userTipo ?? pendingRedirect;
    if (!redirectTipo) {
      return;
    }

    navigate(getRedirectPath(redirectTipo), { replace: true });
  }, [authLoading, navigate, pendingRedirect, session, userTipo]);

  const goToSignUp = (selectedTipo: UserTipo) => {
    setPendingRedirect(null);
    setTipo(selectedTipo);
    setNome("");
    setEmail("");
    setSenha("");
    setStep("signup");
  };

  const handleSignUp = async () => {
    if (!nome.trim() || !email.trim() || !senha.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: senha,
      options: {
        data: {
          nome: nome.trim(),
          tipo,
        },
      },
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    const redirectTipo = normalizeUserTipo(data.user?.user_metadata?.tipo) ?? tipo;
    setPendingRedirect(redirectTipo);
    toast.success("Conta criada com sucesso!");
  };

  const handleLogin = async () => {
    if (!email.trim() || !senha.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    });

    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }

    let redirectTipo = normalizeUserTipo(data.user.user_metadata?.tipo);

    if (!redirectTipo) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("tipo")
        .eq("id", data.user.id)
        .maybeSingle();

      redirectTipo = normalizeUserTipo(profile?.tipo) ?? "freelancer";
    }

    setPendingRedirect(redirectTipo);
    setLoading(false);
    toast.success("Login realizado com sucesso!");
  };

  if (authLoading && !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-primary font-display text-2xl animate-pulse">ELOOPS</div>
      </div>
    );
  }

  if (step === "onboarding") {
    return <OnboardingScreen onComplete={() => setStep("choose")} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 pt-16 pb-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-display font-extrabold gradient-brand-text">ELOOPS</h1>
      </div>

      <AnimatePresence mode="wait">
        {step === "choose" && (
          <motion.div key="choose" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex-1">
            <h2 className="text-xl font-display font-bold text-foreground text-center mb-8">
              Como você quer usar o ELOOPS?
            </h2>
            <div className="space-y-4">
              <button onClick={() => goToSignUp("freelancer")}
                className="w-full flex items-center gap-4 p-5 rounded-xl bg-card border border-border hover:border-primary/40 transition-colors shadow-sm">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Briefcase className="h-7 w-7 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-display font-bold text-foreground">Quero trabalhar</p>
                  <p className="text-sm text-muted-foreground font-light">Encontre vagas e ganhe dinheiro</p>
                </div>
              </button>
              <button onClick={() => goToSignUp("empresa")}
                className="w-full flex items-center gap-4 p-5 rounded-xl bg-card border border-border hover:border-primary/40 transition-colors shadow-sm">
                <div className="w-14 h-14 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <Users className="h-7 w-7 text-orange-500" />
                </div>
                <div className="text-left">
                  <p className="font-display font-bold text-foreground">Quero contratar</p>
                  <p className="text-sm text-muted-foreground font-light">Publique vagas e encontre talentos</p>
                </div>
              </button>
            </div>
            <button onClick={() => { setPendingRedirect(null); setStep("login"); }} className="w-full mt-8 text-center text-sm text-muted-foreground">
              Já tem conta? <span className="text-primary font-medium">Entrar</span>
            </button>
          </motion.div>
        )}

        {step === "signup" && (
          <motion.div key="signup" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex-1">
            <button onClick={() => { setPendingRedirect(null); setStep("choose"); }} className="flex items-center gap-2 text-muted-foreground mb-6">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </button>
            <div className="flex justify-center mb-6">
              <span className="px-4 py-1.5 rounded-full text-xs font-medium gradient-brand text-primary-foreground">
                {tipo === "freelancer" ? "Freelancer" : "Empresa"}
              </span>
            </div>
            <h2 className="text-xl font-display font-bold text-foreground text-center mb-8">Criar conta</h2>
            <div className="space-y-4">
              <Input placeholder="Nome completo" value={nome} onChange={(e) => setNome(e.target.value)}
                className="h-13 rounded-xl bg-card border-border text-foreground placeholder:text-muted-foreground" />
              <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="h-13 rounded-xl bg-card border-border text-foreground placeholder:text-muted-foreground" />
              <Input type="password" placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)}
                className="h-13 rounded-xl bg-card border-border text-foreground placeholder:text-muted-foreground" />
            </div>
            <Button onClick={handleSignUp} disabled={loading}
              className="w-full h-14 mt-6 rounded-xl gradient-brand text-primary-foreground font-display font-bold text-lg shadow-brand hover:opacity-90 transition-opacity">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Criar conta"}
            </Button>
            <button onClick={() => { setPendingRedirect(null); setStep("login"); setEmail(""); setSenha(""); }} className="w-full mt-4 text-center text-sm text-muted-foreground">
              Já tem conta? <span className="text-primary font-medium">Entrar</span>
            </button>
          </motion.div>
        )}

        {step === "login" && (
          <motion.div key="login" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex-1">
            <button onClick={() => { setPendingRedirect(null); setStep("choose"); }} className="flex items-center gap-2 text-muted-foreground mb-6">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </button>
            <h2 className="text-xl font-display font-bold text-foreground text-center mb-8">Entrar</h2>
            <div className="space-y-4">
              <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="h-13 rounded-xl bg-card border-border text-foreground placeholder:text-muted-foreground" />
              <Input type="password" placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)}
                className="h-13 rounded-xl bg-card border-border text-foreground placeholder:text-muted-foreground" />
            </div>
            <Button onClick={handleLogin} disabled={loading}
              className="w-full h-14 mt-6 rounded-xl gradient-brand text-primary-foreground font-display font-bold text-lg shadow-brand hover:opacity-90 transition-opacity">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Entrar"}
            </Button>
            <button onClick={() => { setPendingRedirect(null); setStep("signup"); setEmail(""); setSenha(""); }} className="w-full mt-4 text-center text-sm text-muted-foreground">
              Não tem conta? <span className="text-primary font-medium">Criar conta</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Auth;
