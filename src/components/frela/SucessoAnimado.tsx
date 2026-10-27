import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";

/** Confirmação animada (check com anel), some sozinha. Ex.: "Candidatura enviada!". */
const SucessoAnimado = ({ aberto, titulo, descricao, onFim }: { aberto: boolean; titulo: string; descricao?: string; onFim: () => void }) => {
  useEffect(() => {
    if (!aberto) return;
    const t = setTimeout(onFim, 1800);
    return () => clearTimeout(t);
  }, [aberto, onFim]);

  return (
    <AnimatePresence>
      {aberto && (
        <motion.div
          key="sucesso"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onFim}
          className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center px-8 text-center"
          role="status"
          aria-live="polite"
        >
          <div className="relative w-24 h-24">
            {[0, 1].map((i) => (
              <motion.span key={i} initial={{ scale: 0.6, opacity: 0.5 }} animate={{ scale: 1.9, opacity: 0 }}
                transition={{ duration: 1, delay: 0.15 + i * 0.25, ease: "easeOut" }}
                className="absolute inset-0 rounded-full border-2 border-primary" />
            ))}
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 380, damping: 18 }}
              className="absolute inset-0 rounded-full bg-primary shadow-brand flex items-center justify-center">
              <motion.span initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.15, type: "spring", stiffness: 420, damping: 16 }}>
                <Check className="h-12 w-12 text-primary-foreground" strokeWidth={3} />
              </motion.span>
            </motion.div>
          </div>
          <motion.p initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}
            className="mt-6 text-xl font-display font-bold text-foreground">{titulo}</motion.p>
          {descricao && (
            <motion.p initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }}
              className="mt-1 text-sm text-muted-foreground max-w-xs">{descricao}</motion.p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SucessoAnimado;
