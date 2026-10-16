import { useNavigate, useParams } from "react-router-dom";
import { Headset, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useProfilesByIds } from "@/hooks/useFrela";
import { useEnviarSuporte, useIsAdmin, useMarcarSuporteLido, useSuporteConversa } from "@/hooks/useSuporte";
import { CabecalhoChat, CaixaMensagem, ListaMensagens } from "@/components/chat/ChatParts";
import UserAvatar from "@/components/frela/UserAvatar";
import EmptyState from "@/components/frela/EmptyState";

const ASSUNTOS = ["Tenho uma dúvida sobre o app", "Problema com uma vaga", "Problema com um pagamento", "Quero denunciar um usuário", "Tenho uma sugestão"];

/**
 * Chat com a equipe FreLa.
 * - /suporte → o próprio usuário fala com a equipe
 * - /admin/suporte/:userId → ADM respondendo aquele usuário
 */
const Suporte = () => {
  const { userId: paramUserId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = useIsAdmin();
  const comoAdmin = !!paramUserId;
  const donoId = paramUserId ?? user?.id;

  const { data: mensagens = [], isLoading } = useSuporteConversa(donoId);
  const enviar = useEnviarSuporte(donoId);
  useMarcarSuporteLido(donoId, mensagens, comoAdmin);

  const ids = Array.from(new Set([donoId, ...mensagens.map((m) => m.autor_id)].filter(Boolean) as string[]));
  const { data: perfis = {} } = useProfilesByIds(ids);
  const dono = donoId ? perfis[donoId] : undefined;

  if (comoAdmin && !isAdmin) {
    return <div className="min-h-screen bg-background"><EmptyState icon={ShieldAlert} titulo="Área restrita à equipe FreLa" /></div>;
  }

  const handleEnviar = async (t: string) => {
    try {
      await enviar.mutateAsync(t);
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Não foi possível enviar");
      throw err;
    }
  };

  const bolhas = mensagens.map((m) => {
    const daEquipe = m.autor_id !== m.user_id;
    return {
      id: m.id,
      texto: m.texto,
      created_at: m.created_at,
      minha: m.autor_id === user?.id,
      lida: daEquipe ? m.lida_usuario : m.lida_admin,
      // para o usuário, quem responde aparece como "Equipe FreLa"
      autor: daEquipe && m.autor_id !== user?.id ? (comoAdmin ? perfis[m.autor_id]?.nome ?? "Equipe" : "Equipe FreLa") : undefined,
    };
  });

  return (
    <div className="h-[100dvh] flex flex-col bg-background max-w-lg mx-auto">
      <CabecalhoChat onVoltar={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}>
        {comoAdmin ? (
          <button onClick={() => navigate(`/perfil/${donoId}`)} className="flex items-center gap-3 min-w-0 text-left w-full">
            <UserAvatar nome={dono?.nome} fotoUrl={dono?.foto_url} size="sm" />
            <div className="min-w-0">
              <p className="font-semibold text-foreground truncate leading-tight">{dono?.nome || "Usuário"}</p>
              <p className="text-xs text-muted-foreground truncate">{dono?.tipo === "empresa" ? "Empresa" : "Profissional"} · {dono?.email}</p>
            </div>
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center"><Headset className="h-5 w-5" /></div>
            <div>
              <p className="font-semibold text-foreground leading-tight">Equipe FreLa</p>
              <p className="text-xs text-muted-foreground">Respondemos em até 1 dia útil</p>
            </div>
          </div>
        )}
      </CabecalhoChat>

      <ListaMensagens
        carregando={isLoading}
        mensagens={bolhas}
        vazio={
          comoAdmin ? (
            <p className="text-center text-sm text-muted-foreground py-10">Nenhuma mensagem nesta conversa.</p>
          ) : (
            <div className="py-6 px-2">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3"><Headset className="h-8 w-8" /></div>
                <p className="font-display font-bold text-foreground">Como podemos ajudar?</p>
                <p className="text-sm text-muted-foreground mt-1">Escreva sua mensagem ou escolha um assunto. Nossa equipe responde por aqui.</p>
              </div>
              <div className="flex flex-col gap-2">
                {ASSUNTOS.map((a) => (
                  <button key={a} onClick={() => void handleEnviar(a)}
                    className="text-left px-4 py-3 rounded-xl border border-border bg-card text-sm font-medium hover:border-primary/40">
                    {a}
                  </button>
                ))}
              </div>
            </div>
          )
        }
      />

      <CaixaMensagem onEnviar={handleEnviar} placeholder={comoAdmin ? "Responder como equipe FreLa" : "Escreva para a equipe"} />
    </div>
  );
};

export default Suporte;
