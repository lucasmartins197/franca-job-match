import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useMeuPerfil } from "@/hooks/usePerfil";
import ProfileForm from "@/components/perfil/ProfileForm";
import PageHeader from "@/components/frela/PageHeader";
import PageSkeleton from "@/components/frela/PageSkeleton";

const EditarPerfil = () => {
  const navigate = useNavigate();
  const { data: perfil, isLoading } = useMeuPerfil();

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto pb-12">
      <PageHeader title="Editar perfil" />
      <div className="px-5">
        {isLoading || !perfil ? (
          <PageSkeleton variante="form" comHeader={false} />
        ) : (
          <ProfileForm perfil={perfil} onSaved={() => navigate(-1)} />
        )}
      </div>
    </div>
  );
};

export default EditarPerfil;
