import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePendencias } from "@/hooks/useConfirmacao";
import { useAuth } from "@/hooks/useAuth";

/**
 * Lembrete global: com avaliação obrigatória pendente, o app pede para avaliar
 * ao abrir as telas principais. "Depois" fecha, mas as travas continuam no banco.
 */
const AvaliacaoObrigatoriaModal = () => {
  const { user, userTipo } = useAuth();
  const { avaliar } = usePendencias();
  const location = useLocation();
  const navigate = useNavigate();
  const [dispensadoEm, setDispensadoEm] = useState<string | null>(null);
  const primeira = avaliar[0];
  const telaPrincipal = location.pathname === "/" || location.pathname === "/dashboard";

  useEffect(() => {
    // volta a lembrar quando aparece outra pendência
    if (primeira && dispensadoEm && dispensadoEm !== primeira.contratacao_id) setDispensadoEm(null);
  }, [primeira, dispensadoEm]);

  if (!user || !primeira || !telaPrincipal || dispensadoEm === primeira.contratacao_id) return null;

  return (
    <Dialog open onOpenChange={(o) => !o && setDispensadoEm(primeira.contratacao_id)}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-2"><Star className="h-7 w-7 fill-amber-400 text-amber-500" /></div>
          <DialogTitle className="text-center">Avalie o serviço</DialogTitle>
          <DialogDescription className="text-center">
            “{primeira.titulo}” foi confirmado. A avaliação é obrigatória: enquanto não avaliar,{" "}
            {userTipo === "empresa" ? "você não pode criar vagas nem contratar." : "você não pode se candidatar a novas vagas."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setDispensadoEm(primeira.contratacao_id)} className="flex-1 h-11 rounded-xl">Depois</Button>
          <Button onClick={() => navigate(`/contratacao/${primeira.contratacao_id}#avaliacao`)} className="flex-1 h-11 rounded-xl font-semibold">Avaliar agora</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AvaliacaoObrigatoriaModal;
