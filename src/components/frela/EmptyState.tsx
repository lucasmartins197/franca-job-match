import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Inbox, LucideIcon } from "lucide-react";

interface Props {
  icon?: LucideIcon;
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
}

/** Ilustração leve (formas da marca + ícone), no lugar de uma tela vazia. */
const Ilustracao = ({ Icon }: { Icon: LucideIcon }) => (
  <div className="relative w-36 h-28 mb-5" aria-hidden>
    <svg viewBox="0 0 144 112" className="absolute inset-0 w-full h-full">
      <ellipse cx="72" cy="100" rx="46" ry="6" className="fill-foreground/5" />
      <path d="M30 58c0-26 18-44 44-44 24 0 40 16 40 38 0 24-20 40-44 40-24 0-40-12-40-34z" className="fill-primary/10" />
      <circle cx="22" cy="30" r="5" className="fill-amber-300/70" />
      <circle cx="124" cy="22" r="3.5" className="fill-primary/30" />
      <circle cx="118" cy="82" r="6" className="fill-sky-200" />
      <path d="M14 76l5 0M16.5 73.5l0 5" className="stroke-primary/40" strokeWidth="2" strokeLinecap="round" />
      <path d="M128 50l5 0M130.5 47.5l0 5" className="stroke-amber-400/70" strokeWidth="2" strokeLinecap="round" />
    </svg>
    <motion.div
      initial={{ y: 6, opacity: 0 }}
      animate={{ y: [0, -4, 0], opacity: 1 }}
      transition={{ opacity: { duration: 0.3 }, y: { duration: 3.2, repeat: Infinity, ease: "easeInOut" } }}
      className="absolute left-1/2 top-[22px] -translate-x-1/2 w-16 h-16 rounded-2xl bg-card border border-border shadow-card flex items-center justify-center"
    >
      <Icon className="h-8 w-8 text-primary" />
    </motion.div>
  </div>
);

/** Estado vazio padrão ("nada aqui ainda"), ilustrado e com uma ação. */
const EmptyState = ({ icon: Icon = Inbox, titulo, descricao, acao }: Props) => (
  <div className="flex flex-col items-center text-center py-12 px-6">
    <Ilustracao Icon={Icon} />
    <p className="font-display font-bold text-lg text-foreground">{titulo}</p>
    {descricao && <p className="text-sm text-muted-foreground mt-1.5 max-w-xs leading-relaxed">{descricao}</p>}
    {acao && <div className="mt-5">{acao}</div>}
  </div>
);

export default EmptyState;
