import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: "h-9 w-9 text-sm rounded-lg",
  md: "h-12 w-12 text-base rounded-xl",
  lg: "h-16 w-16 text-xl rounded-2xl",
  xl: "h-24 w-24 text-3xl rounded-3xl",
};

interface Props {
  nome?: string | null;
  fotoUrl?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}

const iniciais = (nome?: string | null) =>
  (nome ?? "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("") || "?";

const UserAvatar = ({ nome, fotoUrl, size = "md", className }: Props) => (
  <Avatar className={cn(SIZES[size], "shrink-0", className)}>
    {fotoUrl && <AvatarImage src={fotoUrl} alt={nome ?? "Foto"} className="object-cover" />}
    <AvatarFallback className={cn(SIZES[size], "bg-primary/10 text-primary font-display font-bold")}>
      {iniciais(nome)}
    </AvatarFallback>
  </Avatar>
);

export default UserAvatar;
