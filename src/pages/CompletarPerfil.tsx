import { useNavigate } from "react-router-dom";
import { Loader2, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMeuPerfil } from "@/hooks/usePerfil";
import { Progress } from "@/components/ui/progress";
import ProfileForm from "@/components/perfil/ProfileForm";
import Logo from "@/components/frela/Logo";

/** Etapa obrigatória depois do cadastro: sem perfil completo, o resto do app fica bloqueado. */
const CompletarPerfil = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { data: perfil, isLoading, faltando } = useMeuPerfil();

  if (isLoading || !perfil) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const isEmpresa = perfil.profile.tipo === "empresa";
  const total = isEmpresa ? 7 : 8;
  const progresso = Math.round(((total - faltando.length) / total) * 100);

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto px-5 pt-10 pb-12">
      <div className="flex items-center justify-between mb-6">
        <Logo size="sm" />
        <button onClick={async () => { await signOut(); navigate("/auth"); }} className="text-sm text-muted-foreground flex items-center gap-1.5">
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </div>
      <h1 className="text-2xl font-display font-bold text-foreground">Complete seu perfil</h1>
      <p className="text-sm text-muted-foreground mt-1 mb-4">
        {isEmpresa
          ? "Profissionais confiam mais em empresas com foto e dados completos. Leva 1 minuto."
          : "Seu perfil é o seu currículo: é o que a empresa vê antes de te contratar."}
      </p>
      <div className="mb-6">
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>{faltando.length === 0 ? "Tudo pronto!" : `Falta: ${faltando.join(", ")}`}</span>
          <span>{progresso}%</span>
        </div>
        <Progress value={progresso} className="h-2" />
      </div>
      <ProfileForm
        perfil={perfil}
        submitLabel="Concluir e entrar no FreLa"
        onSaved={() => navigate(isEmpresa ? "/dashboard" : "/", { replace: true })}
      />
    </div>
  );
};

export default CompletarPerfil;
