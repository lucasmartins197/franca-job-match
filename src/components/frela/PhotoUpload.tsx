import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { uploadFotoPerfil } from "@/hooks/usePerfil";
import UserAvatar from "./UserAvatar";

interface Props {
  userId: string;
  nome?: string | null;
  value: string | null;
  onChange: (url: string) => void;
  obrigatoria?: boolean;
}

const PhotoUpload = ({ userId, nome, value, onChange, obrigatoria }: Props) => {
  const input = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);

  const handleFile = async (file?: File) => {
    if (!file) return;
    setEnviando(true);
    try {
      onChange(await uploadFotoPerfil(userId, file));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar a foto");
    } finally {
      setEnviando(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div className="flex flex-col items-center">
      <button type="button" onClick={() => input.current?.click()} className="relative" aria-label="Escolher foto">
        <UserAvatar nome={nome} fotoUrl={value} size="xl" className={!value && obrigatoria ? "ring-2 ring-primary/40 ring-offset-2 ring-offset-background" : ""} />
        <span className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md border-2 border-background">
          {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
        </span>
      </button>
      <p className="text-xs text-muted-foreground mt-3">
        {value ? "Toque para trocar a foto" : obrigatoria ? "Adicione uma foto (obrigatório)" : "Adicionar foto"}
      </p>
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
    </div>
  );
};

export default PhotoUpload;
