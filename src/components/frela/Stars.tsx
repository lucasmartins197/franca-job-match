import { Star } from "lucide-react";

interface StarsProps {
  value: number;
  size?: "sm" | "md" | "lg";
  onChange?: (nota: number) => void;
}

const SIZES = { sm: "h-3 w-3", md: "h-4 w-4", lg: "h-8 w-8" };

const Stars = ({ value, size = "md", onChange }: StarsProps) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((s) => {
      const icon = (
        <Star className={`${SIZES[size]} ${s <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-border"}`} />
      );
      return onChange ? (
        <button key={s} type="button" onClick={() => onChange(s)} aria-label={`${s} estrela${s > 1 ? "s" : ""}`}>
          {icon}
        </button>
      ) : (
        <span key={s}>{icon}</span>
      );
    })}
  </div>
);

export default Stars;
