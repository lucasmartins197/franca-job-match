import { JobCategory } from "@/types";
import { categoryIcons } from "@/lib/icons";
import { motion } from "framer-motion";
import { CATEGORIES } from "@/data/mockData";

interface CategoryGridProps {
  onSelect?: (category: JobCategory) => void;
  selected?: JobCategory | null;
}

const CategoryGrid = ({ onSelect, selected }: CategoryGridProps) => {
  return (
    <div className="grid grid-cols-3 gap-3">
      {CATEGORIES.map((cat, i) => {
        const Icon = categoryIcons[cat.name];
        const isSelected = selected === cat.name;
        return (
          <motion.button
            key={cat.name}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => onSelect?.(cat.name)}
            className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${
              isSelected
                ? "bg-primary text-primary-foreground border-primary shadow-brand"
                : "bg-card text-foreground border-border/50 hover:border-primary/30"
            }`}
          >
            <div className={`text-2xl`}>{cat.icon}</div>
            <span className="text-[11px] font-semibold leading-tight text-center">
              {cat.name}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
};

export default CategoryGrid;
