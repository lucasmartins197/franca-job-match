import { cn } from "@/lib/utils";

/** Código de 4 dígitos em destaque (o que a empresa mostra ao profissional). */
const CodigoDigitos = ({ codigo, className }: { codigo: string | null | undefined; className?: string }) => (
  <div className={cn("flex justify-center gap-2", className)} aria-label={codigo ? `Código ${codigo.split("").join(" ")}` : "Código indisponível"}>
    {(codigo ?? "····").split("").map((d, i) => (
      <span key={i} className="w-14 h-16 rounded-2xl bg-card border-2 border-primary/40 flex items-center justify-center text-4xl font-display font-extrabold text-foreground tabular-nums shadow-card">
        {d}
      </span>
    ))}
  </div>
);

export default CodigoDigitos;
