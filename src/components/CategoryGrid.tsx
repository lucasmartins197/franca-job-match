import { JobCategory } from "@/types";
import { motion } from "framer-motion";

interface CategoryGridProps {
  onSelect?: (category: JobCategory) => void;
  selected?: JobCategory | null;
}

const categories: { name: JobCategory; emoji: string }[] = [
  { name: "Bares e Restaurantes", emoji: "🍽️" },
  { name: "Eventos", emoji: "🎉" },
  { name: "Comércio", emoji: "🛍️" },
  { name: "Beleza e Estética", emoji: "💇" },
  { name: "Logística", emoji: "🚛" },
  { name: "Indústria", emoji: "🏭" },
];

const CategoryGrid = ({ onSelect, selected }: CategoryGridProps) => (
  <div className="grid grid-cols-3 gap-3">
    {categories.map((cat, i) => {
      const isSelected = selected === cat.name;
      return (
        <motion.button
          key={cat.name}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.04 }}
          onClick={() => onSelect?.(cat.name)}
          className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
            isSelected
              ? "bg-primary/10 border-primary/40 text-primary"
              : "bg-card border-border text-foreground hover:border-primary/20 shadow-sm"
          }`}
        >
          <span className="text-2xl">{cat.emoji}</span>
          <span className="text-[11px] font-medium leading-tight text-center">{cat.name}</span>
        </motion.button>
      );
    })}
  </div>
);

export default CategoryGrid;
