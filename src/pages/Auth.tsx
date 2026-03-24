import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Mail, Lock, User, Briefcase, Users } from "lucide-react";
import { toast } from "sonner";

type Step = "choice" | "signup" | "login";
type UserTipo = "freelancer" | "empresa";

const Auth = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("choice");
  const [tipo, setTipo] = useState<UserTipo | null>(null);
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password || !nome || !tipo) {
      toast.error("Preencha todos os campos");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { tipo, nome },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Conta criada! Verifique seu email para confirmar.");
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("Preencha todos os campos");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    // Fetch tipo and redirect
    const { data: profile } = await supabase
      .from("profiles")
      .select("tipo")
      .eq("id", data.user.id)
      .single();

    if (profile?.tipo === "empresa") {
      navigate("/dashboard");
    } else {
      navigate("/");
    }
  };

  const selectTipo = (t: UserTipo) => {
    setTipo(t);
    setStep("signup");
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      {/* Header */}
      <div className="bg-gradient-hero px-5 pt-12 pb-8 rounded-b-3xl">
        <div className="flex items-center gap-3 mb-6">
          {step !== "choice" && (
            <button
              onClick={() => {
                if (step === "signup" && !isLogin) setStep("choice");
                else if (isLogin) { setIsLogin(false); setStep("choice"); }
                else setStep("choice");
              }}
              className="w-9 h-9 rounded-xl bg-primary-foreground/15 flex items-center justify-center"
            >
              <ArrowLeft className="h-5 w-5 text-primary-foreground" />
            </button>
          )}
          <h1 className="text-2xl font-extrabold text-primary-foreground">ELOOPS</h1>
        </div>
        <p className="text-primary-foreground/70 text-sm">
          {step === "choice"
            ? "Como você quer usar o ELOOPS?"
            : isLogin
            ? "Entre na sua conta"
            : "Crie sua conta"}
        </p>
      </div>

      <div className="px-5 mt-8">
        <AnimatePresence mode="wait">
          {step === "choice" && !isLogin && (
            <motion.div
              key="choice"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <button
                onClick={() => selectTipo("freelancer")}
                className="w-full bg-card border border-border rounded-2xl p-5 flex items-center gap-4 text-left shadow-card hover:shadow-card-hover transition-shadow"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-brand flex items-center justify-center">
                  <Briefcase className="h-7 w-7 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Quero trabalhar</h3>
                  <p className="text-sm text-muted-foreground">Encontre vagas e ganhe dinheiro</p>
                </div>
              </button>

              <button
                onClick={() => selectTipo("empresa")}
                className="w-full bg-card border border-border rounded-2xl p-5 flex items-center gap-4 text-left shadow-card hover:shadow-card-hover transition-shadow"
              >
                <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center">
                  <Users className="h-7 w-7 text-accent-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Quero contratar</h3>
                  <p className="text-sm text-muted-foreground">Publique vagas e encontre talentos</p>
                </div>
              </button>

              <div className="text-center pt-4">
                <p className="text-sm text-muted-foreground">
                  Já tem conta?{" "}
                  <button
                    onClick={() => { setIsLogin(true); setStep("login"); }}
                    className="text-primary font-semibold"
                  >
                    Entrar
                  </button>
                </p>
              </div>
            </motion.div>
          )}

          {(step === "signup" || step === "login" || isLogin) && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {!isLogin && tipo && (
                <div className="flex items-center gap-2 bg-secondary rounded-xl px-4 py-3 mb-2">
                  {tipo === "freelancer" ? (
                    <Briefcase className="h-4 w-4 text-primary" />
                  ) : (
                    <Users className="h-4 w-4 text-accent" />
                  )}
                  <span className="text-sm font-medium text-foreground">
                    {tipo === "freelancer" ? "Freelancer" : "Empresa"}
                  </span>
                </div>
              )}

              {!isLogin && (
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Seu nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="pl-11 h-12 rounded-xl"
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 h-12 rounded-xl"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Senha"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11 h-12 rounded-xl"
                />
              </div>

              <Button
                onClick={isLogin ? handleLogin : handleSignup}
                disabled={loading}
                className="w-full h-14 rounded-2xl bg-gradient-brand text-primary-foreground font-bold text-lg shadow-brand"
                size="lg"
              >
                {loading ? "Aguarde..." : isLogin ? "Entrar" : "Criar conta"}
              </Button>

              <div className="text-center pt-2">
                <p className="text-sm text-muted-foreground">
                  {isLogin ? "Não tem conta? " : "Já tem conta? "}
                  <button
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setStep(isLogin ? "choice" : "login");
                    }}
                    className="text-primary font-semibold"
                  >
                    {isLogin ? "Cadastre-se" : "Entrar"}
                  </button>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Auth;
