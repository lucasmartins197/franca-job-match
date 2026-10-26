import { useNavigate } from "react-router-dom";
import { Loader2, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMeuPerfil } from "@/hooks/usePerfil";
import ProfileForm from "@/components/perfil/ProfileForm";
import Logo from "@/components/frela/Logo";

/** Etapa obrigatória depois do cadastro: sem perfil completo, o resto do app fica bloqueado. */
const CompletarPerfil = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { data: perfil, isLoading } = useMeuPerfil();

  if (isLoading || !perfil) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const isEmpresa = perfil.profile.tipo === "empresa";

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto px-5 pt-10 pb-12">
      <div className="flex items-center justify-between mb-6">
        <Logo size="sm" />
        <button onClick={async () => { await signOut(); navigate("/auth"); }} className="text-sm text-muted-foreground flex items-center gap-1.5">
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </div>
      <h1 className="text-2xl font-display font-bold text-foreground">{isEmpresa ? "Vamos montar o perfil da sua empresa" : "Vamos montar seu currículo"}</h1>
      <p className="text-sm text-muted-foreground mt-1 mb-4">
        {isEmpresa
          ? "Profissionais confiam mais em empresas com foto e dados completos. Leva 1 minuto."
          : "Seu perfil é o seu currículo: é o que a empresa vê antes de te contratar. É grátis e leva 2 minutos."}
      </p>
      <ProfileForm
        perfil={perfil}
        passoAPasso
        submitLabel="Concluir e entrar no FreLa"
        onSaved={() => navigate(isEmpresa ? "/dashboard" : "/", { replace: true })}
      />
    </div>
  );
};

export default CompletarPerfil;
