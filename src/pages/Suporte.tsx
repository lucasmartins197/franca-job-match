import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Headset, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useProfilesByIds } from "@/hooks/useFrela";
import { useEnviarSuporte, useIsAdmin, useMarcarSuporteLido, useSuporteConversa } from "@/hooks/useSuporte";
import { CabecalhoChat, CaixaMensagem, ListaMensagens } from "@/components/chat/ChatParts";
import UserAvatar from "@/components/frela/UserAvatar";
import EmptyState from "@/components/frela/EmptyState";
import AssistenteVera, { AvatarVera } from "@/components/suporte/AssistenteVera";
import { NOME_APP, NOME_ASSISTENTE, PRAZO_RESPOSTA } from "@/lib/suporteFaq";

const ASSUNTOS = ["Tenho uma dúvida sobre o app", "Problema com uma vaga", "Problema com um pagamento", "Quero denunciar um usuário", "Tenho uma sugestão"];

/**
 * Suporte.
 * - /suporte → primeiro a assistente Vera (respostas programadas); se não
 *   resolver, a mensagem vira chamado para a equipe (mesma conversa de sempre)
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

  const ids = Array.from(new Set([donoId, ...mensagens.map((m) => m.autor_id)].filter(Boolean) as string[]));
  const { data: perfis = {} } = useProfilesByIds(ids);
  const dono = donoId ? perfis[donoId] : undefined;
  const naoLidasTime = mensagens.filter((m) => m.autor_id !== m.user_id && !m.lida_usuario).length;
  // Resposta nova da equipe → abre direto a conversa com o time
  const [vista, setVista] = useState<"vera" | "time" | null>(null);
  const vistaAtual = comoAdmin ? "time" : vista ?? (naoLidasTime > 0 ? "time" : "vera");
  useMarcarSuporteLido(donoId, vistaAtual === "time" ? mensagens : [], comoAdmin);

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

  const voltar = () => (window.history.length > 1 ? navigate(-1) : navigate("/"));

  if (!comoAdmin && vistaAtual === "vera" && !isLoading) {
    return (
      <div className="h-[100dvh] flex flex-col bg-background max-w-lg mx-auto">
        <CabecalhoChat onVoltar={voltar}
          direita={
            <button onClick={() => setVista("time")} aria-label="Conversa com o time"
              className="relative w-10 h-10 rounded-xl flex items-center justify-center hover:bg-muted">
              <Headset className="h-5 w-5 text-muted-foreground" />
              {naoLidasTime > 0 && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-destructive" />}
            </button>
          }>
          <div className="flex items-center gap-3">
            <AvatarVera />
            <div>
              <p className="font-semibold text-foreground leading-tight">{NOME_ASSISTENTE} · assistente {NOME_APP}</p>
              <p className="text-xs text-emerald-700 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Online agora</p>
            </div>
          </div>
        </CabecalhoChat>
        <AssistenteVera onVerTime={() => setVista("time")} mensagensTime={mensagens.length} naoLidasTime={naoLidasTime} />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-background max-w-lg mx-auto">
      <CabecalhoChat onVoltar={comoAdmin ? voltar : () => setVista("vera")}
        direita={!comoAdmin ? (
          <button onClick={() => setVista("vera")} className="h-9 px-3 rounded-xl text-xs font-semibold text-primary hover:bg-primary/5 inline-flex items-center gap-1.5">
            <AvatarVera size="sm" /> {NOME_ASSISTENTE}
          </button>
        ) : undefined}>
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
              <p className="font-semibold text-foreground leading-tight">Time de suporte {NOME_APP}</p>
              <p className="text-xs text-muted-foreground">Respondemos em até {PRAZO_RESPOSTA}, por aqui ou por email</p>
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
