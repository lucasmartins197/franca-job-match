import { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useLocation } from "react-router-dom";

/**
 * Transição suave entre telas: só opacidade (sem transform), para não quebrar
 * barras fixas (bottom nav, botão "Candidatar-se") durante a animação.
 * O painel /gestao troca de subpágina sem piscar o layout inteiro.
 */
const TransicaoDeTela = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  const reduzir = useReducedMotion();
  const chave = pathname.startsWith("/gestao") ? "/gestao" : pathname;
  return (
    <motion.div key={chave} initial={reduzir ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.22, ease: "easeOut" }}>
      {children}
    </motion.div>
  );
};

export default TransicaoDeTela;
