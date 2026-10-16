import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DbContratacao, formatBRL, useFinalizarContratacao } from "@/hooks/useFrela";

interface Props {
  contratacao: DbContratacao;
  className?: string;
  onDone?: () => void;
}

const FinalizarContratacaoButton = ({ contratacao, className, onDone }: Props) => {
  const finalizar = useFinalizarContratacao();

  const handleConfirm = async () => {
    try {
      await finalizar.mutateAsync(contratacao);
      toast.success("Serviço finalizado! Agora avalie o profissional.");
      onDone?.();
    } catch {
      toast.error("Erro ao confirmar finalização");
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button disabled={finalizar.isPending}
          className={`rounded-xl text-primary-foreground font-semibold ${className ?? ""}`}>
          {finalizar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4 mr-2" /> Confirmar finalização</>}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar que o serviço foi realizado?</AlertDialogTitle>
          <AlertDialogDescription>
            Ao confirmar, a contratação é encerrada e vocês poderão se avaliar.
            A taxa da plataforma é de 5% do valor ({formatBRL(contratacao.taxa_5pct ?? contratacao.valor * 0.05)}), cobrada depois, fora do app.
            Durante o lançamento ela não está sendo cobrada.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Voltar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>Confirmar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default FinalizarContratacaoButton;
