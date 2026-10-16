import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { CATEGORIAS, Categoria } from "@/lib/categorias";
import { cn } from "@/lib/utils";

interface CategoryGridProps {
  selected?: string | null;
  onSelect?: (id: string | null) => void;
  /** Quantidade de vagas abertas por categoria (id → n) */
  contagem?: Record<string, number>;
}

const VISIVEIS = 8;

/** Grid de cards de categoria com ícone e cor. Clicar filtra o feed. */
const CategoryGrid = ({ selected, onSelect, contagem = {} }: CategoryGridProps) => {
  const [todas, setTodas] = useState(false);
  const selecionada = CATEGORIAS.findIndex((c) => c.id === selected);
  const lista: Categoria[] = todas || selecionada >= VISIVEIS ? CATEGORIAS : CATEGORIAS.slice(0, VISIVEIS);

  return (
    <div>
      <div className="grid grid-cols-4 gap-2.5">
        {lista.map((cat, i) => {
          const ativo = selected === cat.id;
          const n = contagem[cat.id] ?? 0;
          return (
            <motion.button
              key={cat.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 8) * 0.025 }}
              onClick={() => onSelect?.(ativo ? null : cat.id)}
              aria-pressed={ativo}
              className={cn(
                "relative flex flex-col items-center gap-1.5 rounded-2xl p-2 pt-3 pb-2.5 border transition-all",
                ativo ? "border-primary bg-primary/5 ring-2 ring-primary/30" : "border-border bg-card hover:border-primary/40 shadow-card"
              )}
            >
              <span className={cn("w-11 h-11 rounded-xl flex items-center justify-center", cat.cor)}>
                <cat.icon className="h-5 w-5" />
              </span>
              <span className="text-[11px] font-semibold leading-tight text-center text-foreground line-clamp-2">{cat.curto}</span>
              {n > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {n}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
      {!(selecionada >= VISIVEIS) && (
        <button onClick={() => setTodas(!todas)} className="w-full mt-2.5 text-sm font-semibold text-primary flex items-center justify-center gap-1">
          {todas ? "Mostrar menos" : `Ver todas as ${CATEGORIAS.length} categorias`}
          <ChevronDown className={cn("h-4 w-4 transition-transform", todas && "rotate-180")} />
        </button>
      )}
    </div>
  );
};

export default CategoryGrid;
