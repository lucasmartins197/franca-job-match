import { useState } from "react";
import { BadgeDollarSign, Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DbContratacao, formatBRL } from "@/hooks/useFrela";
import { useConfirmarValor } from "@/hooks/useTaxas";

/** Passo 2 da finalização (profissional): confirma ou contesta o valor declarado pela empresa. */
const ConfirmarValorCard = ({ contratacao, empresaNome }: { contratacao: DbContratacao; empresaNome: string }) => {
  const confirmar = useConfirmarValor();
  const [contestando, setContestando] = useState(false);
  const [valorReal, setValorReal] = useState("");
  const [motivo, setMotivo] = useState("");
  const valorNum = Number(valorReal.replace(",", "."));

  const enviar = async (confirma: boolean) => {
    try {
      await confirmar.mutateAsync({
        contratacaoId: contratacao.id,
        confirma,
        valorRecebido: confirma ? undefined : valorNum,
        motivo: confirma ? undefined : motivo,
      });
      setContestando(false);
      toast.success(confirma ? "Valor confirmado. Obrigado!" : "Recebemos sua contestação. A equipe FreLa vai analisar.");
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Não foi possível enviar");
    }
  };

  return (
    <section className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4">
      <div className="flex gap-3">
        <span className="w-10 h-10 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0"><BadgeDollarSign className="h-5 w-5" /></span>
        <div>
          <p className="font-display font-bold text-amber-950">Confirme o valor recebido</p>
          <p className="text-sm text-amber-900 mt-0.5">{empresaNome} informou que pagou a você:</p>
          <p className="text-2xl font-display font-extrabold text-amber-950 mt-1">{formatBRL(contratacao.valor)}</p>
        </div>
      </div>
      <div className="flex flex-col gap-2 mt-4">
        <Button onClick={() => enviar(true)} disabled={confirmar.isPending} className="w-full h-11 rounded-xl font-semibold">
          {confirmar.isPending && !contestando ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 mr-1" /> Sim, recebi esse valor</>}
        </Button>
        <Button variant="outline" onClick={() => setContestando(true)} disabled={confirmar.isPending}
          className="w-full h-11 rounded-xl border-amber-400 bg-white text-amber-900 hover:bg-amber-100">
          <X className="h-4 w-4 mr-1" /> Recebi um valor diferente
        </Button>
      </div>
      <p className="text-[11px] text-amber-800 mt-2">Sua confirmação é confidencial e ajuda a manter o FreLa justo para todos.</p>

      <Dialog open={contestando} onOpenChange={setContestando}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Qual valor você recebeu?</DialogTitle>
            <DialogDescription>A equipe FreLa vai analisar e ajustar. A empresa será avisada da divergência.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="valor-real">Valor que você recebeu (R$)</Label>
              <Input id="valor-real" type="number" inputMode="decimal" min="0" step="0.01" value={valorReal}
                onChange={(e) => setValorReal(e.target.value)} className="h-12 rounded-xl text-lg font-semibold" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="motivo">O que aconteceu? (opcional)</Label>
              <Textarea id="motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={300}
                placeholder="Ex: combinamos R$ 150 mas recebi R$ 120" className="rounded-xl min-h-[70px]" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setContestando(false)} className="flex-1 h-11 rounded-xl">Voltar</Button>
            <Button onClick={() => enviar(false)} disabled={!valorReal || !Number.isFinite(valorNum) || valorNum < 0 || confirmar.isPending}
              className="flex-1 h-11 rounded-xl font-semibold">
              {confirmar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar contestação"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default ConfirmarValorCard;
