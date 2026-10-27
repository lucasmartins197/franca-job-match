import { AnimatePresence, motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useVagasSalvas } from "@/hooks/useVagasSalvas";
import { cn } from "@/lib/utils";

/** Coração para salvar a vaga, com animação de "curtir". */
const SalvarVagaButton = ({ jobId, className }: { jobId: string; className?: string }) => {
  const { ehSalva, alternar } = useVagasSalvas();
  const salva = ehSalva(jobId);
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.8 }}
      onClick={(e) => { e.stopPropagation(); alternar(jobId); }}
      aria-pressed={salva}
      aria-label={salva ? "Remover das vagas salvas" : "Salvar vaga"}
      className={cn("relative w-9 h-9 rounded-full flex items-center justify-center bg-background/80 backdrop-blur border border-border/70", className)}
    >
      <motion.span key={String(salva)} initial={{ scale: salva ? 0.4 : 1 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 15 }}>
        <Heart className={cn("h-4 w-4 transition-colors", salva ? "fill-rose-500 text-rose-500" : "text-muted-foreground")} />
      </motion.span>
      <AnimatePresence>
        {salva && (
          <motion.span key="anel" initial={{ scale: 0.6, opacity: 0.6 }} animate={{ scale: 1.8, opacity: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }} className="absolute inset-0 rounded-full border-2 border-rose-400 pointer-events-none" />
        )}
      </AnimatePresence>
    </motion.button>
  );
};

export default SalvarVagaButton;
