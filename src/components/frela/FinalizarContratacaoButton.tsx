import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DbContratacao, formatBRL, useFinalizarContratacao } from "@/hooks/useFrela";
import { mensagemTrava, useResumoTaxas } from "@/hooks/useTaxas";
import { calcularTaxa } from "@/lib/pagamentos";

interface Props {
  contratacao: DbContratacao;
  className?: string;
  onDone?: () => void;
}

/**
 * Passo 1 da finalização (empresa): confirma o serviço e declara o valor pago.
 * Travado quando o saldo de taxas atinge o teto.
 */
const FinalizarContratacaoButton = ({ contratacao, className, onDone }: Props) => {
  const navigate = useNavigate();
  const finalizar = useFinalizarContratacao();
  const { resumo } = useResumoTaxas();
  const [aberto, setAberto] = useState(false);
  const [valor, setValor] = useState(String(contratacao.valor ?? ""));
  const valorNum = Number(valor.replace(",", "."));
  const valido = Number.isFinite(valorNum) && valorNum > 0;

  if (resumo.bloqueado) {
    return (
      <Button variant="outline" onClick={() => navigate("/taxas")}
        className={`rounded-xl border-destructive/40 text-destructive hover:bg-destructive/5 ${className ?? ""}`}>
        <Lock className="h-4 w-4 mr-2" /> Quite as taxas para finalizar
      </Button>
    );
  }

  const handleConfirm = async () => {
    if (!valido) return;
    try {
      await finalizar.mutateAsync({ contratacao, valor: valorNum });
      setAberto(false);
      toast.success("Serviço finalizado! O profissional vai confirmar o valor. Agora avalie.");
      onDone?.();
    } catch (err) {
      toast.error(mensagemTrava(err) ?? (err instanceof Error && err.message ? err.message : "Erro ao confirmar finalização"));
    }
  };

  return (
    <>
      <Button onClick={() => setAberto(true)} disabled={finalizar.isPending}
        className={`rounded-xl text-primary-foreground font-semibold ${className ?? ""}`}>
        {finalizar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4 mr-2" /> Confirmar finalização</>}
      </Button>
      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Confirmar que o serviço foi realizado</DialogTitle>
            <DialogDescription>
              Informe quanto você pagou ao profissional. Ele vai confirmar esse valor pelo app.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="valor-pago">Valor pago ao profissional (R$)</Label>
            <Input id="valor-pago" type="number" inputMode="decimal" min="1" step="0.01" value={valor}
              onChange={(e) => setValor(e.target.value)} className="h-12 rounded-xl text-lg font-semibold" />
            {Number(contratacao.valor) !== valorNum && valido && (
              <p className="text-xs text-amber-700">Diferente do valor da vaga ({formatBRL(contratacao.valor)}).</p>
            )}
          </div>
          <div className="rounded-xl bg-muted/60 p-3 text-sm space-y-1">
            <div className="flex justify-between"><span className="text-muted-foreground">Taxa FreLa (5%)</span><b>{formatBRL(valido ? calcularTaxa(valorNum) : 0)}</b></div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Saldo de taxas depois</span>
              <span>{formatBRL(resumo.saldo + (valido ? calcularTaxa(valorNum) : 0))} de {formatBRL(resumo.teto)}</span>
            </div>
          </div>
          {valido && resumo.saldo + calcularTaxa(valorNum) >= resumo.teto && (
            <p className="text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2">
              Com esta finalização você atinge o limite de taxas: novas vagas e finalizações ficarão travadas até quitar.
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            A taxa não é cobrada agora: ela entra no seu saldo de taxas, que você quita depois em "Minhas taxas".
          </p>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={() => setAberto(false)} className="flex-1 h-11 rounded-xl">Voltar</Button>
            <Button onClick={handleConfirm} disabled={!valido || finalizar.isPending} className="flex-1 h-11 rounded-xl font-semibold">
              {finalizar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FinalizarContratacaoButton;
