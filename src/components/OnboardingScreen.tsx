import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, ArrowRight, Briefcase, Users, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OnboardingScreenProps {
  onComplete: () => void;
}

const slides = [
  {
    title: "ELOOPS",
    subtitle: "Trabalhos rápidos na sua cidade",
    description: "Conectamos freelancers e empresas para trabalhos presenciais por turno.",
    icon: MapPin,
    emoji: "🏙️",
  },
  {
    title: "Encontre vagas",
    subtitle: "Trabalhe quando quiser",
    description: "Garçom, promotor, vendedor, caixa e muito mais. Escolha suas habilidades e receba ofertas.",
    icon: Briefcase,
    emoji: "💼",
  },
  {
    title: "Contrate rápido",
    subtitle: "Freelancers avaliados e prontos",
    description: "Publique sua vaga e encontre profissionais qualificados em minutos.",
    icon: Users,
    emoji: "⚡",
  },
];

const OnboardingScreen = ({ onComplete }: OnboardingScreenProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <div className="text-7xl mb-8">{slides[currentSlide].emoji}</div>
            <h1 className="text-3xl font-extrabold text-primary-foreground mb-2">
              {slides[currentSlide].title}
            </h1>
            <p className="text-lg font-semibold text-primary-foreground/80 mb-4">
              {slides[currentSlide].subtitle}
            </p>
            <p className="text-primary-foreground/60 max-w-xs mx-auto leading-relaxed">
              {slides[currentSlide].description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="px-6 pb-12">
        <div className="flex justify-center gap-2 mb-8">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentSlide
                  ? "w-8 bg-primary-foreground"
                  : "w-2 bg-primary-foreground/30"
              }`}
            />
          ))}
        </div>

        <Button
          onClick={nextSlide}
          className="w-full h-14 rounded-2xl bg-card text-foreground font-bold text-lg hover:bg-card/90 shadow-lg"
          size="lg"
        >
          {currentSlide < slides.length - 1 ? "Próximo" : "Começar"}
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>

        {currentSlide < slides.length - 1 && (
          <button
            onClick={onComplete}
            className="w-full mt-3 text-primary-foreground/50 text-sm font-medium"
          >
            Pular
          </button>
        )}
      </div>
    </div>
  );
};

export default OnboardingScreen;
