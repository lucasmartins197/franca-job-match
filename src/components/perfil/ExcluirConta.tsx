import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useEnviarSuporte } from "@/hooks/useSuporte";

/**
 * Exclusão de conta pelo próprio app (exigência da Apple e do Google).
 * Hoje vira um pedido no suporte, que a equipe conclui em até 7 dias.
 * TODO (LOJAS): automatizar com uma Edge Function (service_role) que apaga o
 * usuário em auth.users e anonimiza contratações/avaliações.
 */
const ExcluirConta = () => {
  const { user } = useAuth();
  const enviar = useEnviarSuporte(user?.id);
  const [aberto, setAberto] = useState(false);

  const confirmar = async () => {
    try {
      await enviar.mutateAsync("Quero excluir minha conta e meus dados do FreLa (LGPD).");
      setAberto(false);
      toast.success("Pedido enviado. Sua conta será excluída em até 7 dias e avisaremos pelo suporte.");
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Não foi possível enviar o pedido");
    }
  };

  return (
    <>
      <button onClick={() => setAberto(true)} className="w-full text-center text-xs text-muted-foreground underline decoration-dotted">
        Excluir minha conta
      </button>
      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <div className="w-14 h-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-2"><Trash2 className="h-7 w-7" /></div>
            <DialogTitle className="text-center">Excluir sua conta?</DialogTitle>
            <DialogDescription className="text-center">
              Seu perfil, currículo, fotos e mensagens serão apagados em até 7 dias. Registros de contratações e taxas podem ser mantidos de forma anônima quando a lei exigir.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setAberto(false)} className="flex-1 h-11 rounded-xl">Cancelar</Button>
            <Button variant="destructive" onClick={confirmar} disabled={enviar.isPending} className="flex-1 h-11 rounded-xl font-semibold">
              {enviar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excluir conta"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ExcluirConta;
