import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DbContratacao } from "@/hooks/useFrela";
import { useAdminEncerrar } from "@/hooks/useConfirmacao";

/** ADM: encerra uma contratação travada (ex.: profissional sem celular, não compareceu). */
const AdminEncerrarCard = ({ contratacao }: { contratacao: DbContratacao }) => {
  const encerrar = useAdminEncerrar();
  const [valor, setValor] = useState(String(contratacao.valor ?? ""));
  const valorNum = Number(valor.replace(",", "."));

  const enviar = async (v: number) => {
    if (!window.confirm(v === 0 ? "Encerrar como NÃO realizado (sem taxa)?" : `Encerrar como realizado com valor R$ ${v.toFixed(2)}?`)) return;
    try {
      await encerrar.mutateAsync({ contratacaoId: contratacao.id, valor: v });
      toast.success("Contratação encerrada. Os dois lados vão avaliar.");
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Erro ao encerrar");
    }
  };

  return (
    <section className="rounded-2xl border border-dashed border-primary/40 p-4 space-y-3">
      <p className="font-display font-bold text-foreground flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Ação do ADM</p>
      <p className="text-xs text-muted-foreground">Use só quando o código não puder ser usado. A taxa (5%) vale sobre o valor informado; com R$ 0 não há taxa.</p>
      <div className="flex gap-2">
        <Input type="number" inputMode="decimal" min="0" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} className="h-11 rounded-xl" aria-label="Valor pago" />
        <Button onClick={() => enviar(valorNum)} disabled={!Number.isFinite(valorNum) || valorNum < 0 || encerrar.isPending} className="h-11 rounded-xl shrink-0">
          {encerrar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Encerrar"}
        </Button>
      </div>
      <button onClick={() => enviar(0)} disabled={encerrar.isPending} className="text-xs font-semibold text-destructive">Serviço não aconteceu (sem taxa)</button>
    </section>
  );
};

export default AdminEncerrarCard;
