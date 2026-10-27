import { useState } from "react";
import { AnimatePresence, motion, PanInfo } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/frela/Logo";
import { IlustraComecar, IlustraPerto, IlustraPublicar, IlustraSeguranca } from "@/components/onboarding/Ilustracoes";
import { cn } from "@/lib/utils";

export type Perfil = "freelancer" | "empresa";
export type FimOnboarding = { acao: "cadastro"; tipo: Perfil } | { acao: "entrar" } | { acao: "pular" };

/** Já viu as boas-vindas neste aparelho? (mostramos só na primeira vez) */
export const CHAVE_ONBOARDING = "frela-onboarding-visto";
export const onboardingVisto = () => {
  try {
    return localStorage.getItem(CHAVE_ONBOARDING) === "1";
  } catch {
    return false;
  }
};

const SLIDES: { Ilustra: () => JSX.Element; titulo: string; texto: Record<Perfil, string> }[] = [
  {
    Ilustra: IlustraPublicar,
    titulo: "Precisa de gente pra um trabalho? Publique a vaga.",
    texto: {
      freelancer: "Bares, lojas, eventos e fábricas de Franca publicam vagas de um dia — e você fica sabendo na hora.",
      empresa: "Garçom, promotor, ajudante... Em 1 minuto sua vaga aparece para quem está perto e disponível.",
    },
  },
  {
    Ilustra: IlustraPerto,
    titulo: "Quer trabalhar? Encontre vagas perto de você.",
    texto: {
      freelancer: "Veja no mapa, filtre por dia, período e valor e candidate-se com um toque. Grátis para você.",
      empresa: "Profissionais da região recebem aviso da sua vaga nos dias em que estão livres.",
    },
  },
  {
    Ilustra: IlustraSeguranca,
    titulo: "Combine, trabalhe e avalie — com segurança.",
    texto: {
      freelancer: "Perfil das empresas com avaliações, código de confirmação no local e você recebe o valor cheio.",
      empresa: "Currículo, selos e avaliações de cada candidato. Você só paga 5% quando o serviço acontece.",
    },
  },
  {
    Ilustra: IlustraComecar,
    titulo: "Comece agora.",
    texto: {
      freelancer: "Monte seu currículo em 2 minutos e veja as vagas de hoje.",
      empresa: "Crie a conta da sua empresa e publique a primeira vaga hoje.",
    },
  },
];

/** Boas-vindas (primeira abertura): 4 telas ilustradas, puláveis, com bolinhas de progresso. */
const OnboardingScreen = ({ onComplete }: { onComplete: (fim: FimOnboarding) => void }) => {
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const [perfil, setPerfil] = useState<Perfil>("freelancer");
  const ultimo = i === SLIDES.length - 1;
  const slide = SLIDES[i];

  const terminar = (fim: FimOnboarding) => {
    try {
      localStorage.setItem(CHAVE_ONBOARDING, "1");
    } catch {
      /* sem storage: mostra de novo na próxima vez */
    }
    onComplete(fim);
  };
  const ir = (n: number) => {
    if (n < 0 || n >= SLIDES.length) return;
    setDir(n > i ? 1 : -1);
    setI(n);
  };
  const arrastou = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -60 || info.velocity.x < -400) ir(i + 1);
    else if (info.offset.x > 60 || info.velocity.x > 400) ir(i - 1);
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col max-w-md mx-auto px-6 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <header className="flex items-center justify-between h-12">
        <Logo size="sm" />
        {!ultimo && (
          <button onClick={() => terminar({ acao: "pular" })} className="text-sm font-semibold text-muted-foreground px-2 py-1">Pular</button>
        )}
      </header>

      <div className="mt-2 grid grid-cols-2 bg-muted rounded-full p-1" role="tablist" aria-label="Como você vai usar">
        {(["freelancer", "empresa"] as Perfil[]).map((p) => (
          <button key={p} role="tab" aria-selected={perfil === p} onClick={() => setPerfil(p)}
            className={cn("relative h-9 rounded-full text-sm font-semibold transition-colors", perfil === p ? "text-foreground" : "text-muted-foreground")}>
            {perfil === p && <motion.span layoutId="perfil-onb" className="absolute inset-0 rounded-full bg-card shadow-card" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
            <span className="relative">{p === "freelancer" ? "Quero trabalhar" : "Quero contratar"}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col justify-center overflow-hidden">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div
            key={i}
            custom={dir}
            initial={{ opacity: 0, x: 40 * dir }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 * dir }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.25}
            onDragEnd={arrastou}
            className="touch-pan-y select-none"
          >
            <div className="w-full aspect-[320/260] max-h-[42dvh] mx-auto"><slide.Ilustra /></div>
            <h1 className="mt-7 text-[26px] leading-tight font-display font-extrabold text-foreground">{slide.titulo}</h1>
            <AnimatePresence mode="wait" initial={false}>
              <motion.p key={perfil} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                className="mt-3 text-[15px] text-muted-foreground leading-relaxed">
                {slide.texto[perfil]}
              </motion.p>
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex justify-center gap-2 mb-6" role="tablist" aria-label="Progresso">
        {SLIDES.map((_, n) => (
          <button key={n} onClick={() => ir(n)} aria-label={`Tela ${n + 1} de ${SLIDES.length}`} aria-selected={n === i} role="tab" className="p-1">
            <motion.span animate={{ width: n === i ? 24 : 8 }} className={cn("block h-2 rounded-full", n === i ? "bg-primary" : "bg-border")} />
          </button>
        ))}
      </div>

      {ultimo ? (
        <div className="space-y-2.5">
          <Button onClick={() => terminar({ acao: "cadastro", tipo: perfil })} className="w-full h-13 py-3.5 rounded-2xl text-base font-semibold shadow-brand">
            {perfil === "freelancer" ? "Criar minha conta grátis" : "Criar conta da empresa"}
          </Button>
          <Button variant="ghost" onClick={() => terminar({ acao: "entrar" })} className="w-full h-11 rounded-2xl text-muted-foreground">
            Já tenho conta
          </Button>
        </div>
      ) : (
        <Button onClick={() => ir(i + 1)} className="w-full h-13 py-3.5 rounded-2xl text-base font-semibold">
          Continuar <ArrowRight className="h-5 w-5 ml-1" />
        </Button>
      )}
    </div>
  );
};

export default OnboardingScreen;
