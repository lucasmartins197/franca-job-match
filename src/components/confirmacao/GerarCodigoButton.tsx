import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, KeyRound, Loader2, Lock, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DbContratacao, formatBRL } from "@/hooks/useFrela";
import { useResumoTaxas } from "@/hooks/useTaxas";
import { useGerarCodigo } from "@/hooks/useConfirmacao";
import { calcularTaxa } from "@/lib/pagamentos";
import CodigoDigitos from "./CodigoDigitos";

interface Props {
  contratacao: DbContratacao;
  className?: string;
  /** "novo" = já existe código e a empresa quer outro */
  variante?: "gerar" | "novo";
}

/**
 * Passo 1 (empresa): o serviço foi realizado → declara o valor pago e gera o
 * código de 4 dígitos que o profissional vai digitar. Travado com o teto de taxas.
 */
const GerarCodigoButton = ({ contratacao, className, variante = "gerar" }: Props) => {
  const navigate = useNavigate();
  const gerar = useGerarCodigo();
  const { resumo } = useResumoTaxas();
  const [aberto, setAberto] = useState(false);
  const [codigo, setCodigo] = useState<string | null>(null);
  const [valor, setValor] = useState(String(contratacao.valor ?? ""));
  const valorNum = Number(valor.replace(",", "."));
  const valido = Number.isFinite(valorNum) && valorNum > 0;

  if (resumo.bloqueado) {
    return (
      <Button variant="outline" onClick={() => navigate("/taxas")}
        className={`rounded-xl border-destructive/40 text-destructive hover:bg-destructive/5 ${className ?? ""}`}>
        <Lock className="h-4 w-4 mr-2" /> Quite as taxas para confirmar
      </Button>
    );
  }

  const abrir = () => {
    setCodigo(null);
    setValor(String(contratacao.valor ?? ""));
    setAberto(true);
  };

  const handleGerar = async () => {
    if (!valido) return;
    try {
      setCodigo(await gerar.mutateAsync({ contratacaoId: contratacao.id, valor: valorNum }));
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Erro ao gerar o código");
    }
  };

  return (
    <>
      {variante === "novo" ? (
        <Button variant="outline" onClick={abrir} className={`rounded-xl ${className ?? ""}`}>
          <RefreshCw className="h-4 w-4 mr-2" /> Gerar novo código
        </Button>
      ) : (
        <Button onClick={abrir} className={`rounded-xl text-primary-foreground font-semibold ${className ?? ""}`}>
          <CheckCircle2 className="h-4 w-4 mr-2" /> Serviço realizado
        </Button>
      )}
      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-w-sm rounded-2xl">
          {codigo ? (
            <>
              <DialogHeader>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-1"><KeyRound className="h-6 w-6" /></div>
                <DialogTitle className="text-center">Passe este código ao profissional</DialogTitle>
                <DialogDescription className="text-center">
                  Mostre ou fale o código pessoalmente, no local. Ele digita no app dele para confirmar o serviço.
                </DialogDescription>
              </DialogHeader>
              <CodigoDigitos codigo={codigo} className="my-2" />
              <p className="text-xs text-muted-foreground text-center">
                Não envie pelo chat: o código prova que vocês se encontraram. Ele fica salvo na contratação.
              </p>
              <Button onClick={() => { setAberto(false); navigate(`/contratacao/${contratacao.id}`); }} className="w-full h-11 rounded-xl font-semibold">
                Ok, entendi
              </Button>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>{variante === "novo" ? "Gerar um novo código" : "O serviço foi realizado?"}</DialogTitle>
                <DialogDescription>
                  Informe quanto você pagou ao profissional. Vamos gerar um código de 4 dígitos para você passar a ele pessoalmente.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-1.5">
                <Label htmlFor="valor-pago">Valor pago ao profissional (R$)</Label>
                <Input id="valor-pago" type="number" inputMode="decimal" min="1" step="0.01" value={valor}
                  onChange={(e) => setValor(e.target.value)} className="h-12 rounded-xl text-lg font-semibold" />
                {Number(contratacao.valor) !== valorNum && valido && (
                  <p className="text-xs text-amber-700">Diferente do valor combinado ({formatBRL(contratacao.valor)}).</p>
                )}
              </div>
              <div className="rounded-xl bg-muted/60 p-3 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Taxa FreLa (5%)</span><b>{formatBRL(valido ? calcularTaxa(valorNum) : 0)}</b></div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Saldo de taxas depois</span>
                  <span>{formatBRL(resumo.saldo + (valido ? calcularTaxa(valorNum) : 0))} de {formatBRL(resumo.teto)}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                A taxa só entra no seu saldo quando o profissional digitar o código. Ela não é cobrada agora: você quita depois em “Minhas taxas”.
              </p>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" onClick={() => setAberto(false)} className="flex-1 h-11 rounded-xl">Voltar</Button>
                <Button onClick={handleGerar} disabled={!valido || gerar.isPending} className="flex-1 h-11 rounded-xl font-semibold">
                  {gerar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Gerar código"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GerarCodigoButton;
