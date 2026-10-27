import { ReactNode, useRef, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";

const LIMITE = 70;

/** "Puxe para atualizar" (toque). Só ativa com a página no topo. */
const PullToRefresh = ({ onRefresh, children }: { onRefresh: () => Promise<unknown>; children: ReactNode }) => {
  const inicio = useRef<number | null>(null);
  const [puxado, setPuxado] = useState(0);
  const [atualizando, setAtualizando] = useState(false);

  const onTouchStart = (e: React.TouchEvent) => {
    inicio.current = window.scrollY <= 0 && !atualizando ? e.touches[0].clientY : null;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (inicio.current == null) return;
    const d = e.touches[0].clientY - inicio.current;
    setPuxado(d > 0 ? Math.min(110, d * 0.5) : 0);
  };
  const onTouchEnd = async () => {
    if (inicio.current == null) return;
    inicio.current = null;
    if (puxado >= LIMITE) {
      setAtualizando(true);
      setPuxado(56);
      try {
        await onRefresh();
      } finally {
        setAtualizando(false);
        setPuxado(0);
      }
    } else {
      setPuxado(0);
    }
  };

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} className="relative">
      <div className="absolute inset-x-0 top-0 flex justify-center pointer-events-none" style={{ height: puxado }} aria-hidden={!atualizando}>
        {puxado > 8 && (
          <span className="mt-3 w-9 h-9 rounded-full bg-card border border-border shadow-card flex items-center justify-center">
            <RefreshCw className={`h-4 w-4 text-primary ${atualizando ? "animate-spin" : ""}`}
              style={atualizando ? undefined : { transform: `rotate(${puxado * 3}deg)`, opacity: Math.min(1, puxado / LIMITE) }} />
          </span>
        )}
      </div>
      <motion.div animate={{ y: puxado }} transition={{ type: "spring", stiffness: 400, damping: 40 }} style={puxado === 0 ? { transform: "none" } : undefined}>
        {children}
      </motion.div>
      {atualizando && <span className="sr-only" role="status">Atualizando</span>}
    </div>
  );
};

export default PullToRefresh;
