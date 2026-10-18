import { useNavigate } from "react-router-dom";
import { AlertTriangle, ChevronRight, Lock } from "lucide-react";
import { formatBRL } from "@/hooks/useFrela";
import { useResumoTaxas } from "@/hooks/useTaxas";
import { cn } from "@/lib/utils";

/** Banner da conta de taxas: amarelo perto do teto, vermelho quando travado. Some quando está tudo ok. */
const TaxasAviso = ({ className }: { className?: string }) => {
  const navigate = useNavigate();
  const { resumo } = useResumoTaxas();
  if (!resumo.bloqueado && !resumo.perto) return null;

  const bloq = resumo.bloqueado;
  return (
    <button onClick={() => navigate("/taxas")}
      className={cn("w-full text-left rounded-2xl border p-4 flex gap-3",
        bloq ? "border-destructive/40 bg-destructive/5" : "border-amber-300 bg-amber-50", className)}>
      {bloq ? <Lock className="h-5 w-5 text-destructive shrink-0 mt-0.5" /> : <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />}
      <div className={cn("text-sm flex-1", bloq ? "text-destructive" : "text-amber-900")}>
        <p className="font-bold mb-0.5">{bloq ? "Conta travada por taxas em aberto" : "Seu saldo de taxas está perto do limite"}</p>
        <p className={bloq ? "text-foreground/80" : ""}>
          {bloq
            ? `Saldo de ${formatBRL(resumo.saldo)} atingiu o limite de ${formatBRL(resumo.teto)}. Para criar vagas e confirmar finalizações, quite as taxas.`
            : `Você tem ${formatBRL(resumo.saldo)} de ${formatBRL(resumo.teto)}. Ao atingir o limite, novas vagas e finalizações ficam bloqueadas.`}
        </p>
        <p className="font-semibold mt-1.5 flex items-center gap-0.5">Ver minhas taxas <ChevronRight className="h-4 w-4" /></p>
      </div>
    </button>
  );
};

export default TaxasAviso;
