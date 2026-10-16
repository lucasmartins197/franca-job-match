import { JobCategory } from "@/types";
import { categoryIcons } from "@/lib/icons";
import { cn } from "@/lib/utils";

interface CategoryGridProps {
  onSelect?: (category: JobCategory | null) => void;
  selected?: JobCategory | null;
}

const CATEGORIAS = Object.keys(categoryIcons) as JobCategory[];

/** Faixa horizontal de categorias (rolável no celular). */
const CategoryGrid = ({ onSelect, selected }: CategoryGridProps) => (
  <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 pb-1">
    <button onClick={() => onSelect?.(null)}
      className={cn("shrink-0 px-3.5 h-9 rounded-full text-sm font-medium border transition-colors",
        !selected ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border")}>
      Todas
    </button>
    {CATEGORIAS.map((cat) => {
      const Icon = categoryIcons[cat];
      const ativo = selected === cat;
      return (
        <button key={cat} onClick={() => onSelect?.(ativo ? null : cat)}
          className={cn("shrink-0 inline-flex items-center gap-1.5 px-3.5 h-9 rounded-full text-sm font-medium border transition-colors",
            ativo ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:border-primary/40")}>
          <Icon className="h-4 w-4" /> {cat}
        </button>
      );
    })}
  </div>
);

export default CategoryGrid;
