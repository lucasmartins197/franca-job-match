import { useNavigate, useParams } from "react-router-dom";
import { ChevronRight, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useContratacao, useProfilesByIds } from "@/hooks/useFrela";
import { useEnviarMensagem, useMarcarConversaLida, useMensagens } from "@/hooks/useChat";
import UserAvatar from "@/components/frela/UserAvatar";
import EmptyState from "@/components/frela/EmptyState";
import { CabecalhoChat, CaixaMensagem, ListaMensagens } from "@/components/chat/ChatParts";

const Conversa = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: contratacao, isLoading: loadingC } = useContratacao(id);
  const { data: mensagens = [], isLoading: loadingM } = useMensagens(id);
  const enviar = useEnviarMensagem(contratacao);
  useMarcarConversaLida(id, mensagens);

  const outroId = contratacao ? (contratacao.empresa_id === user?.id ? contratacao.profissional_id : contratacao.empresa_id) : undefined;
  const { data: perfis = {} } = useProfilesByIds(outroId ? [outroId] : []);
  const outro = outroId ? perfis[outroId] : undefined;
  const souEmpresa = contratacao?.empresa_id === user?.id;
  const outroNome = souEmpresa ? outro?.nome || "Profissional" : contratacao?.jobs?.company_name || outro?.nome || "Empresa";

  const handleEnviar = async (t: string) => {
    try {
      await enviar.mutateAsync(t);
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Não foi possível enviar");
      throw err;
    }
  };

  if (loadingC) {
    return <div className="h-[100dvh] flex items-center justify-center bg-background"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }
  if (!contratacao) {
    return <div className="min-h-screen bg-background"><EmptyState titulo="Conversa não encontrada" /></div>;
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-background max-w-lg mx-auto">
      <CabecalhoChat
        onVoltar={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}
        direita={
          <button onClick={() => navigate(`/contratacao/${contratacao.id}`)} className="text-xs font-semibold text-primary flex items-center shrink-0 pr-1">
            Detalhes <ChevronRight className="h-4 w-4" />
          </button>
        }
      >
        <button onClick={() => outroId && navigate(`/perfil/${outroId}`)} className="flex items-center gap-3 min-w-0 text-left w-full">
          <UserAvatar nome={outroNome} fotoUrl={outro?.foto_url} size="sm" />
          <div className="min-w-0">
            <p className="font-semibold text-foreground truncate leading-tight">{outroNome}</p>
            <p className="text-xs text-muted-foreground truncate">{contratacao.jobs?.title}</p>
          </div>
        </button>
      </CabecalhoChat>

      <ListaMensagens
        carregando={loadingM}
        mensagens={mensagens.map((m) => ({ id: m.id, texto: m.texto, created_at: m.created_at, minha: m.de_id === user?.id, lida: !!m.lida }))}
        vazio={
          <div className="text-center text-sm text-muted-foreground py-10 px-6">
            <p className="font-semibold text-foreground mb-1">Comece a conversa 👋</p>
            <p>Combine horário de chegada, traje, ponto de encontro... Tudo fica registrado aqui.</p>
          </div>
        }
      />

      <CaixaMensagem
        onEnviar={handleEnviar}
        aviso={contratacao.status === "finalizada" && (
          <p className="text-[11px] text-muted-foreground text-center mb-1.5 flex items-center justify-center gap-1">
            <Lock className="h-3 w-3" /> Contratação finalizada — a conversa continua disponível.
          </p>
        )}
      />
    </div>
  );
};

export default Conversa;
