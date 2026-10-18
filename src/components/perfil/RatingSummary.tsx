import { Star } from "lucide-react";
import Stars from "@/components/frela/Stars";

/** Nota grande + distribuição 5→1 estrelas. */
const RatingSummary = ({ media, total, notas }: { media: number; total: number; notas: number[] }) => {
  const contagem = [5, 4, 3, 2, 1].map((n) => ({ n, qtd: notas.filter((x) => x === n).length }));
  const max = Math.max(1, ...contagem.map((c) => c.qtd));
  return (
    <div className="flex items-center gap-5">
      <div className="text-center shrink-0">
        <p className="text-4xl font-display font-extrabold text-foreground leading-none">{total > 0 ? media.toFixed(1) : "—"}</p>
        <Stars value={media} size="sm" />
        <p className="text-xs text-muted-foreground mt-1">{total} avaliaç{total === 1 ? "ão" : "ões"}</p>
      </div>
      <div className="flex-1 space-y-1">
        {contagem.map(({ n, qtd }) => (
          <div key={n} className="flex items-center gap-2 text-xs">
            <span className="w-3 text-muted-foreground">{n}</span>
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-amber-400" style={{ width: `${(qtd / max) * 100}%` }} />
            </div>
            <span className="w-5 text-right text-muted-foreground">{qtd}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RatingSummary;
