import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Briefcase, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OnboardingScreenProps {
  onComplete: () => void;
}

const slides = [
  {
    title: "ELOOPS",
    subtitle: "O trabalho certo. Na hora certa.",
    icon: null,
    isLogo: true,
  },
  {
    title: "Encontre trabalhos em minutos",
    subtitle: "Garçom, promotor, vendedor e muito mais. Escolha e receba ofertas.",
    icon: Briefcase,
    isLogo: false,
  },
  {
    title: "Contrate rápido",
    subtitle: "Publique sua vaga e encontre o profissional ideal em menos de 4 horas.",
    icon: Zap,
    isLogo: false,
  },
];

const OnboardingScreen = ({ onComplete }: OnboardingScreenProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) setCurrentSlide(currentSlide + 1);
    else onComplete();
  };

  const slide = slides[currentSlide];

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `linear-gradient(hsl(var(--brand)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--brand)) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />

      <div className="flex-1 flex flex-col items-center justify-center px-8 pt-12 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35 }}
            className="text-center"
          >
            {slide.isLogo ? (
              <>
                <h1 className="text-5xl font-display font-extrabold gradient-brand-text mb-4">
                  ELOOPS
                </h1>
                <p className="text-lg text-foreground/70 font-light max-w-xs mx-auto">
                  {slide.subtitle}
                </p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-2xl gradient-brand flex items-center justify-center mx-auto mb-8">
                  {slide.icon && <slide.icon className="h-10 w-10 text-primary-foreground" />}
                </div>
                <h2 className="text-2xl font-display font-bold text-foreground mb-3">
                  {slide.title}
                </h2>
                <p className="text-muted-foreground max-w-xs mx-auto leading-relaxed font-light">
                  {slide.subtitle}
                </p>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="px-8 pb-12 relative z-10">
        <div className="flex justify-center gap-2 mb-8">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === currentSlide ? "w-8 bg-primary" : "w-2 bg-foreground/20"
              }`}
            />
          ))}
        </div>

        <Button
          onClick={nextSlide}
          className="w-full h-14 rounded-xl gradient-brand text-primary-foreground font-display font-bold text-lg hover:opacity-90 shadow-brand transition-opacity"
          size="lg"
        >
          {currentSlide < slides.length - 1 ? "Próximo" : "Começar"}
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>

        {currentSlide < slides.length - 1 && (
          <button
            onClick={onComplete}
            className="w-full mt-4 text-foreground/30 text-sm font-medium"
          >
            Pular
          </button>
        )}
      </div>
    </div>
  );
};

export default OnboardingScreen;
