import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, Building2, ArrowLeft, Loader2, MailCheck, ChevronRight, KeyRound, CheckCircle2 } from "lucide-react";
import OnboardingScreen from "@/components/OnboardingScreen";
import Logo from "@/components/frela/Logo";
import { useAuth } from "@/hooks/useAuth";

type Step = "onboarding" | "choose" | "signup" | "login" | "confirm" | "recuperar";
type UserTipo = "freelancer" | "empresa";

const EMAIL_JA_EXISTE = "Este email já possui uma conta. Faça login.";

const getRedirectPath = (tipo: UserTipo) => (tipo === "empresa" ? "/dashboard" : "/");

const traduzErro = (message: string) => {
  const m = message.toLowerCase();
  if (m.includes("already registered") || m.includes("already been registered") || m.includes("already exists")) return EMAIL_JA_EXISTE;
  if (m.includes("invalid login credentials")) return "Email ou senha incorretos";
  if (m.includes("password should be at least")) return "A senha precisa ter pelo menos 6 caracteres";
  if (m.includes("unable to validate email") || m.includes("invalid format")) return "Email inválido";
  if (m.includes("rate limit") || m.includes("security purposes")) return "Muitas tentativas. Aguarde um minuto e tente de novo.";
  return message;
};

const Auth = () => {
  const navigate = useNavigate();
  const { session, userTipo, loading: authLoading, refreshAuthState } = useAuth();
  const [searchParams] = useSearchParams();
  const codigoDoLink = (searchParams.get("indicacao") ?? searchParams.get("ref") ?? "").trim().toUpperCase();
  // Quem chega por link de indicação pula a apresentação
  const [step, setStep] = useState<Step>(codigoDoLink ? "choose" : "onboarding");
  const [codigoIndicacao, setCodigoIndicacao] = useState(codigoDoLink);
  const [indicadoPor, setIndicadoPor] = useState<string | null>(null);
  const [tipo, setTipo] = useState<UserTipo>("freelancer");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [linkEnviado, setLinkEnviado] = useState(false);

  // Valida o código de indicação enquanto digita (mostra quem indicou)
  useEffect(() => {
    const codigo = codigoIndicacao.trim();
    if (codigo.length < 4) {
      setIndicadoPor(null);
      return;
    }
    let cancelado = false;
    const t = setTimeout(async () => {
      const { data } = await supabase.rpc("validar_codigo_indicacao", { p_codigo: codigo });
      if (!cancelado) setIndicadoPor(data ?? null);
    }, 350);
    return () => {
      cancelado = true;
      clearTimeout(t);
    };
  }, [codigoIndicacao]);

  useEffect(() => {
    if (!authLoading && session && userTipo) {
      navigate(getRedirectPath(userTipo), { replace: true });
    }
  }, [authLoading, navigate, session, userTipo]);

  const goToSignUp = (selectedTipo: UserTipo) => {
    setTipo(selectedTipo);
    setNome("");
    setTelefone("");
    setSenha("");
    setStep("signup");
  };

  const goToLogin = () => {
    setSenha("");
    setStep("login");
  };

  const redirectAfterAuth = async () => {
    const authState = await refreshAuthState();
    navigate(getRedirectPath(authState.userTipo ?? "freelancer"), { replace: true });
  };

  const handleSignUp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!nome.trim() || !email.trim() || !senha) {
      toast.error("Preencha nome, email e senha");
      return;
    }
    if (senha.length < 6) {
      toast.error("A senha precisa ter pelo menos 6 caracteres");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: senha,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`,
        data: {
          nome: nome.trim(),
          tipo,
          telefone: telefone.trim() || null,
          // Indique e Ganhe: o banco liga o cadastro a quem indicou (handle_new_user)
          indicacao: codigoIndicacao.trim().toUpperCase() || null,
        },
      },
    });

    if (error) {
      setLoading(false);
      const msg = traduzErro(error.message);
      toast.error(msg);
      if (msg === EMAIL_JA_EXISTE) goToLogin();
      return;
    }

    // Com confirmação de email ligada, o Supabase NÃO devolve erro para email já
    // cadastrado: devolve um usuário "fantasma" sem identities. Tratamos como duplicado.
    if (data.user && (data.user.identities?.length ?? 0) === 0) {
      setLoading(false);
      toast.error(EMAIL_JA_EXISTE);
      goToLogin();
      return;
    }

    // Uma conta existente nunca pode ser "aproveitada" com outro tipo.
    const tipoCriado = data.user?.user_metadata?.tipo;
    if (data.session && tipoCriado && tipoCriado !== tipo) {
      await supabase.auth.signOut();
      setLoading(false);
      toast.error(EMAIL_JA_EXISTE);
      goToLogin();
      return;
    }

    if (!data.session) {
      setLoading(false);
      setSenha("");
      setStep("confirm");
      return;
    }

    toast.success("Conta criada! Agora complete seu perfil.");
    await redirectAfterAuth();
    setLoading(false);
  };

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email.trim() || !senha) {
      toast.error("Preencha email e senha");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });

    if (error) {
      setLoading(false);
      if (error.code === "email_not_confirmed" || error.message.toLowerCase().includes("not confirmed")) {
        setStep("confirm");
        return;
      }
      toast.error(traduzErro(error.message));
      return;
    }

    await redirectAfterAuth();
    setLoading(false);
  };

  const handleReenviar = async () => {
    if (!email.trim()) return;
    setReenviando(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth` },
    });
    setReenviando(false);
    if (error) toast.error(traduzErro(error.message));
    else toast.success("Email reenviado! Confira também a caixa de spam.");
  };

  const handleRecuperar = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email.trim()) {
      toast.error("Informe seu email");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    setLoading(false);
    if (error) {
      toast.error(traduzErro(error.message));
      return;
    }
    // Por segurança, a mensagem é a mesma exista ou não uma conta com esse email.
    setLinkEnviado(true);
  };

  if (authLoading && !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Logo size="md" className="animate-pulse" />
      </div>
    );
  }

  if (step === "onboarding") {
    return <OnboardingScreen onComplete={() => setStep("choose")} />;
  }

  const anim = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -16 }, transition: { duration: 0.2 } };
  const backButton = (to: Step) => (
    <button onClick={() => setStep(to)} className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6 -ml-1">
      <ArrowLeft className="h-4 w-4" /> Voltar
    </button>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 pt-14 pb-8 max-w-md mx-auto">
      <div className="text-center mb-10">
        <Logo size="md" />
        <p className="text-sm text-muted-foreground mt-1">Freelancers presenciais em Franca/SP</p>
      </div>

      <AnimatePresence mode="wait">
        {step === "choose" && (
          <motion.div key="choose" {...anim} className="flex-1">
            {codigoDoLink && (
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3 mb-5 text-sm text-center text-foreground">
                🎁 {indicadoPor ? <>Você foi indicado por <b>{indicadoPor}</b>.</> : "Você recebeu um convite."} Crie sua conta para começar.
              </div>
            )}
            <h2 className="text-xl font-display font-bold text-foreground text-center mb-6">Como você quer usar o FreLa?</h2>
            <div className="space-y-3">
              {[
                { t: "freelancer" as const, icon: Briefcase, title: "Quero trabalhar", sub: "Encontre vagas e ganhe dinheiro" },
                { t: "empresa" as const, icon: Building2, title: "Quero contratar", sub: "Publique vagas e encontre profissionais" },
              ].map((o) => (
                <button key={o.t} onClick={() => goToSignUp(o.t)}
                  className="w-full flex items-center gap-4 p-5 rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow-md transition-all text-left">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <o.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-display font-bold text-foreground">{o.title}</p>
                    <p className="text-sm text-muted-foreground">{o.sub}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
              ))}
            </div>
            <button onClick={goToLogin} className="w-full mt-8 text-center text-sm text-muted-foreground">
              Já tem conta? <span className="text-primary font-semibold">Entrar</span>
            </button>
          </motion.div>
        )}

        {step === "signup" && (
          <motion.form key="signup" {...anim} onSubmit={handleSignUp} className="flex-1">
            {backButton("choose")}
            <div className="flex justify-center mb-3">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                {tipo === "freelancer" ? "Conta de profissional" : "Conta de empresa"}
              </span>
            </div>
            <h2 className="text-xl font-display font-bold text-foreground text-center mb-6">Criar conta</h2>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="nome">{tipo === "empresa" ? "Nome do responsável" : "Nome completo"}</Label>
                <Input id="nome" autoComplete="name" value={nome} onChange={(e) => setNome(e.target.value)} className="h-12 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tel">Telefone / WhatsApp</Label>
                <Input id="tel" type="tel" autoComplete="tel" placeholder="(16) 99999-0000" value={telefone} onChange={(e) => setTelefone(e.target.value)} className="h-12 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="senha">Senha</Label>
                <Input id="senha" type="password" autoComplete="new-password" placeholder="Mínimo 6 caracteres" value={senha} onChange={(e) => setSenha(e.target.value)} className="h-12 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="indicacao">Código de indicação <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                <Input id="indicacao" value={codigoIndicacao} maxLength={12} autoCapitalize="characters" placeholder="Ex: A1B2C3"
                  onChange={(e) => setCodigoIndicacao(e.target.value.toUpperCase())} className="h-12 rounded-xl uppercase tracking-widest" />
                {codigoIndicacao.length >= 4 && (
                  indicadoPor
                    ? <p className="text-xs text-emerald-700 flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Indicado por {indicadoPor}</p>
                    : <p className="text-xs text-muted-foreground">Código não encontrado — confira com quem te indicou.</p>
                )}
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full h-12 mt-6 rounded-xl font-semibold text-base">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Criar conta"}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-3">
              Ao criar a conta você aceita os <a href="/termos" className="underline">Termos de Uso</a> e a{" "}
              <a href="/privacidade" className="underline">Política de Privacidade</a>.
            </p>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Cada email tem uma única conta — de profissional <b>ou</b> de empresa.
            </p>
            <button type="button" onClick={goToLogin} className="w-full mt-4 text-center text-sm text-muted-foreground">
              Já tem conta? <span className="text-primary font-semibold">Entrar</span>
            </button>
          </motion.form>
        )}

        {step === "login" && (
          <motion.form key="login" {...anim} onSubmit={handleLogin} className="flex-1">
            {backButton("choose")}
            <h2 className="text-xl font-display font-bold text-foreground text-center mb-6">Entrar</h2>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="login-email">Email</Label>
                <Input id="login-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="login-senha">Senha</Label>
                <Input id="login-senha" type="password" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} className="h-12 rounded-xl" />
              </div>
            </div>
            <button type="button" onClick={() => { setLinkEnviado(false); setStep("recuperar"); }} className="block ml-auto mt-3 text-sm font-medium text-primary">
              Esqueci minha senha
            </button>
            <Button type="submit" disabled={loading} className="w-full h-12 mt-4 rounded-xl font-semibold text-base">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Entrar"}
            </Button>
            <button type="button" onClick={() => setStep("choose")} className="w-full mt-4 text-center text-sm text-muted-foreground">
              Não tem conta? <span className="text-primary font-semibold">Criar conta</span>
            </button>
          </motion.form>
        )}

        {step === "recuperar" && (
          <motion.form key="recuperar" {...anim} onSubmit={handleRecuperar} className="flex-1">
            {backButton("login")}
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <KeyRound className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-display font-bold text-foreground text-center mb-2">Recuperar senha</h2>
            {linkEnviado ? (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Se existir uma conta com <b className="text-foreground break-all">{email}</b>, você vai receber um email com o link para criar uma nova senha.
                </p>
                <p className="text-xs text-muted-foreground mt-2">Confira também o spam. O link vale por pouco tempo.</p>
                <Button type="button" onClick={goToLogin} className="w-full h-12 mt-6 rounded-xl font-semibold">Voltar para o login</Button>
                <Button type="button" variant="ghost" onClick={() => handleRecuperar()} disabled={loading} className="w-full h-11 mt-2 rounded-xl text-primary">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reenviar link"}
                </Button>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground text-center mb-6">Informe o email da sua conta e enviaremos um link para criar uma nova senha.</p>
                <div className="space-y-1.5">
                  <Label htmlFor="rec-email">Email</Label>
                  <Input id="rec-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl" />
                </div>
                <Button type="submit" disabled={loading} className="w-full h-12 mt-6 rounded-xl font-semibold text-base">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Enviar link"}
                </Button>
              </>
            )}
          </motion.form>
        )}

        {step === "confirm" && (
          <motion.div key="confirm" {...anim} className="flex-1 text-center">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <MailCheck className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-xl font-display font-bold text-foreground mb-2">Confirme seu email para continuar</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Enviamos um email de confirmação para
            </p>
            <p className="font-semibold text-foreground mb-4 break-all">{email}</p>
            <div className="bg-card border border-border rounded-2xl p-4 text-left text-sm text-muted-foreground space-y-2 mb-6">
              <p>1. Abra sua caixa de entrada (e confira o spam/promoções).</p>
              <p>2. Clique no link <b>"Confirmar email"</b>.</p>
              <p>3. Volte aqui e entre com seu email e senha.</p>
            </div>
            <Button onClick={goToLogin} className="w-full h-12 rounded-xl font-semibold">Já confirmei, quero entrar</Button>
            <Button variant="ghost" onClick={handleReenviar} disabled={reenviando} className="w-full h-11 mt-2 rounded-xl text-primary">
              {reenviando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Não recebi — reenviar email"}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Auth;
