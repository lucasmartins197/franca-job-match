import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ReactNode } from "react";

/** Cabeçalho fixo de telas internas, com botão voltar. */
const PageHeader = ({ title, right }: { title: string; right?: ReactNode }) => {
  const navigate = useNavigate();
  return (
    <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-lg px-5 pt-10 pb-4 flex items-center gap-3 mb-1">
      <button
        onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}
        aria-label="Voltar"
        className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center shadow-card shrink-0"
      >
        <ArrowLeft className="h-5 w-5 text-foreground" />
      </button>
      <h1 className="font-display font-bold text-lg text-foreground flex-1 truncate">{title}</h1>
      {right}
    </div>
  );
};

export default PageHeader;
