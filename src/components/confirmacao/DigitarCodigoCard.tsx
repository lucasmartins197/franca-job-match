import { useState } from "react";
import { Info, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { DbContratacao, formatBRL } from "@/hooks/useFrela";
import { MAX_TENTATIVAS_CODIGO, useConfirmarCodigo } from "@/hooks/useConfirmacao";
import { cn } from "@/lib/utils";

/**
 * Passo 2 (profissional): digita o código que a empresa passou no local.
 * Também confirma (ou contesta) o valor que a empresa declarou.
 */
const DigitarCodigoCard = ({ contratacao, empresaNome }: { contratacao: DbContratacao; empresaNome: string }) => {
  const confirmar = useConfirmarCodigo();
  const [codigo, setCodigo] = useState("");
  const [valorDiferente, setValorDiferente] = useState(false);
  const [valorReal, setValorReal] = useState("");
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const gerado = !!contratacao.codigo_gerado_em;
  const restantes = MAX_TENTATIVAS_CODIGO - contratacao.codigo_tentativas;
  const valorNum = Number(valorReal.replace(",", "."));
  const podeEnviar = codigo.length === 4 && (!valorDiferente || (valorReal !== "" && Number.isFinite(valorNum) && valorNum >= 0));

  if (!gerado) {
    return (
      <section className="rounded-2xl border border-blue-200 bg-blue-50 p-4 flex gap-3 text-sm text-blue-900">
        <Info className="h-5 w-5 shrink-0" />
        <p>
          Você está confirmado(a)! Compareça no dia e horário combinados. Ao final do serviço, {empresaNome} vai te passar
          um <b>código de 4 dígitos</b> — digite aqui para confirmar o serviço.
        </p>
      </section>
    );
  }

  const enviar = async () => {
    setErro(null);
    try {
      const r = await confirmar.mutateAsync({
        contratacaoId: contratacao.id, codigo, valorConfere: !valorDiferente, valorRecebido: valorNum, motivo,
      });
      if (r === "incorreto") {
        setCodigo("");
        setErro(`Código incorreto. Confira com a empresa (${Math.max(0, restantes - 1)} tentativa(s) restante(s)).`);
      } else if (r === "bloqueado") {
        setCodigo("");
        setErro("Código bloqueado por excesso de tentativas. Peça para a empresa gerar um novo código.");
      } else {
        toast.success(r === "em_divergencia" ? "Serviço confirmado! Sua contestação do valor vai para a equipe FreLa." : "Serviço confirmado! Agora avalie a empresa.");
      }
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Não foi possível confirmar");
    }
  };

  return (
    <section className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-4 space-y-4">
      <div className="flex gap-3">
        <span className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0"><KeyRound className="h-5 w-5" /></span>
        <div>
          <p className="font-display font-bold text-foreground">Digite o código da empresa</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            {empresaNome} marcou o serviço como realizado. Peça o código de 4 dígitos <b>pessoalmente</b> e digite abaixo.
          </p>
        </div>
      </div>

      {restantes <= 0 ? (
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          Código bloqueado por excesso de tentativas. Peça para a empresa gerar um novo código.
        </p>
      ) : (
        <>
          <div className="flex justify-center">
            <InputOTP maxLength={4} value={codigo} onChange={(v) => { setCodigo(v.replace(/\D/g, "")); setErro(null); }} inputMode="numeric" pattern="^[0-9]*$" aria-label="Código de 4 dígitos">
              <InputOTPGroup className="gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <InputOTPSlot key={i} index={i} className="w-14 h-16 rounded-2xl border-2 first:rounded-l-2xl last:rounded-r-2xl text-3xl font-display font-bold bg-card" />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
          {erro && <p className="text-sm text-destructive text-center font-medium" role="alert">{erro}</p>}

          <div className="rounded-xl bg-card border border-border p-3 space-y-2">
            <p className="text-sm text-muted-foreground">Valor que a empresa informou ter pago:</p>
            <p className="text-2xl font-display font-extrabold text-foreground">{formatBRL(contratacao.valor)}</p>
            <div className="grid grid-cols-2 gap-2">
              {[false, true].map((dif) => (
                <button key={String(dif)} type="button" onClick={() => setValorDiferente(dif)}
                  className={cn("h-10 rounded-xl border text-sm font-semibold", valorDiferente === dif ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground")}>
                  {dif ? "Recebi outro valor" : "Recebi esse valor"}
                </button>
              ))}
            </div>
            {valorDiferente && (
              <div className="space-y-2 pt-1">
                <div className="space-y-1.5">
                  <Label htmlFor="valor-real">Quanto você recebeu (R$)</Label>
                  <Input id="valor-real" type="number" inputMode="decimal" min="0" step="0.01" value={valorReal}
                    onChange={(e) => setValorReal(e.target.value)} className="h-11 rounded-xl font-semibold" />
                </div>
                <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={300}
                  placeholder="O que aconteceu? (opcional)" className="rounded-xl min-h-[60px]" />
                <p className="text-[11px] text-muted-foreground">A equipe FreLa analisa a diferença. Sua resposta é confidencial.</p>
              </div>
            )}
          </div>

          <Button onClick={enviar} disabled={!podeEnviar || confirmar.isPending} className="w-full h-12 rounded-xl font-semibold text-base">
            {confirmar.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirmar serviço"}
          </Button>
          {contratacao.codigo_tentativas > 0 && !erro && (
            <p className="text-xs text-muted-foreground text-center">{restantes} tentativa(s) restante(s).</p>
          )}
        </>
      )}
    </section>
  );
};

export default DigitarCodigoCard;
