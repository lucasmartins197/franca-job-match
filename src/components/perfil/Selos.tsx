import { Award, BadgeCheck, Briefcase, Crown, Sparkles, Star } from "lucide-react";
import { Selo } from "@/hooks/usePerfil";
import { cn } from "@/lib/utils";

const ESTILO: Record<Selo["tipo"], { icon: typeof Award; cls: string }> = {
  verificado: { icon: BadgeCheck, cls: "bg-primary text-primary-foreground" },
  top: { icon: Award, cls: "bg-amber-100 text-amber-800" },
  trabalhos: { icon: Briefcase, cls: "bg-secondary text-secondary-foreground" },
  novo: { icon: Sparkles, cls: "bg-sky-100 text-sky-800" },
  destaque: { icon: Star, cls: "bg-amber-400 text-amber-950" },
  indicado: { icon: Crown, cls: "bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-sm" },
};

const Selos = ({ selos, size = "md", className }: { selos: Selo[]; size?: "sm" | "md"; className?: string }) => {
  if (selos.length === 0) return null;
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {selos.map((s) => {
        const { icon: Icon, cls } = ESTILO[s.tipo];
        return (
          <span key={s.id} className={cn("inline-flex items-center gap-1 rounded-full font-semibold", cls,
            size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs")}>
            <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} /> {s.texto}
          </span>
        );
      })}
    </div>
  );
};

export default Selos;
