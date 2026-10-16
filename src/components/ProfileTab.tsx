import { useNavigate } from "react-router-dom";
import { Edit2, Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useMeuPerfil } from "@/hooks/usePerfil";
import ProfileView from "@/components/perfil/ProfileView";

/** Meu perfil (aba Perfil do profissional e /profile da empresa). */
const ProfileTab = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: perfil, isLoading } = useMeuPerfil();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (isLoading || !perfil) {
    return <div className="flex justify-center pt-24"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="pb-24 pt-6 px-5 space-y-4">
      <ProfileView perfil={perfil} mostrarContato />
      <p className="text-xs text-center text-muted-foreground">{user?.email}</p>
      <Button onClick={() => navigate("/perfil/editar")} className="w-full h-12 rounded-xl font-semibold">
        <Edit2 className="h-4 w-4 mr-2" /> Editar perfil
      </Button>
      <Button onClick={handleSignOut} variant="outline"
        className="w-full h-12 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10">
        <LogOut className="h-4 w-4 mr-2" /> Sair da conta
      </Button>
    </div>
  );
};

export default ProfileTab;
