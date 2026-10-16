import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ReactNode } from "react";

const PageHeader = ({ title, right }: { title: string; right?: ReactNode }) => {
  const navigate = useNavigate();
  return (
    <div className="px-5 pt-12 pb-6 flex items-center gap-3">
      <button
        onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}
        aria-label="Voltar"
        className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center shadow-sm"
      >
        <ArrowLeft className="h-5 w-5 text-foreground" />
      </button>
      <h1 className="font-display font-bold text-foreground flex-1 truncate">{title}</h1>
      {right}
    </div>
  );
};

export default PageHeader;
