import { Fragment, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, Loader2, SendHorizontal, Lock } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useContratacao, useProfilesByIds } from "@/hooks/useFrela";
import { useEnviarMensagem, useMarcarConversaLida, useMensagens } from "@/hooks/useChat";
import UserAvatar from "@/components/frela/UserAvatar";
import EmptyState from "@/components/frela/EmptyState";
import { cn } from "@/lib/utils";

const rotuloDia = (iso: string) => {
  const d = new Date(iso);
  const hoje = new Date();
  if (d.toDateString() === hoje.toDateString()) return "Hoje";
  if (d.toDateString() === new Date(hoje.getTime() - 86_400_000).toDateString()) return "Ontem";
  return d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "long" });
};

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

  const [texto, setTexto] = useState("");
  const fim = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fim.current?.scrollIntoView({ behavior: mensagens.length > 30 ? "auto" : "smooth" });
  }, [mensagens.length]);

  const handleEnviar = async () => {
    const t = texto.trim();
    if (!t || enviar.isPending) return;
    setTexto("");
    try {
      await enviar.mutateAsync(t);
    } catch (err) {
      setTexto(t);
      toast.error(err instanceof Error && err.message ? err.message : "Não foi possível enviar");
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
      <header className="flex items-center gap-3 px-3 pt-8 pb-3 border-b border-border bg-card/95 backdrop-blur">
        <button onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))} aria-label="Voltar"
          className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <button onClick={() => outroId && navigate(`/perfil/${outroId}`)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
          <UserAvatar nome={outroNome} fotoUrl={outro?.foto_url} size="sm" />
          <div className="min-w-0">
            <p className="font-semibold text-foreground truncate leading-tight">{outroNome}</p>
            <p className="text-xs text-muted-foreground truncate">{contratacao.jobs?.title}</p>
          </div>
        </button>
        <button onClick={() => navigate(`/contratacao/${contratacao.id}`)} className="text-xs font-semibold text-primary flex items-center shrink-0 pr-1">
          Detalhes <ChevronRight className="h-4 w-4" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loadingM ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : mensagens.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-10 px-6">
            <p className="font-semibold text-foreground mb-1">Comece a conversa 👋</p>
            <p>Combine horário de chegada, traje, ponto de encontro... Tudo fica registrado aqui.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {mensagens.map((m, i) => {
              const minha = m.de_id === user?.id;
              const anterior = mensagens[i - 1];
              const novoDia = !anterior || new Date(anterior.created_at).toDateString() !== new Date(m.created_at).toDateString();
              const agrupada = !novoDia && anterior?.de_id === m.de_id;
              const pendente = m.id.startsWith("tmp-");
              return (
                <Fragment key={m.id}>
                  {novoDia && (
                    <div className="flex justify-center py-2">
                      <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">{rotuloDia(m.created_at)}</span>
                    </div>
                  )}
                  <div className={cn("flex", minha ? "justify-end" : "justify-start", !agrupada && "pt-1.5")}>
                    <div className={cn(
                      "max-w-[80%] px-3.5 py-2 rounded-2xl text-[15px] leading-snug shadow-sm",
                      minha ? "bg-primary text-primary-foreground rounded-br-md" : "bg-card border border-border text-foreground rounded-bl-md",
                      pendente && "opacity-70"
                    )}>
                      <p className="whitespace-pre-wrap break-words">{m.texto}</p>
                      <p className={cn("text-[10px] mt-0.5 text-right", minha ? "text-primary-foreground/70" : "text-muted-foreground")}>
                        {pendente ? "enviando…" : new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        {minha && !pendente && (m.lida ? " · lida" : "")}
                      </p>
                    </div>
                  </div>
                </Fragment>
              );
            })}
          </div>
        )}
        <div ref={fim} />
      </div>

      <div className="border-t border-border bg-card px-3 py-2.5 pb-safe">
        {contratacao.status === "finalizada" && (
          <p className="text-[11px] text-muted-foreground text-center mb-1.5 flex items-center justify-center gap-1">
            <Lock className="h-3 w-3" /> Contratação finalizada — a conversa continua disponível.
          </p>
        )}
        <div className="flex items-end gap-2">
          <Textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleEnviar();
              }
            }}
            rows={1}
            maxLength={2000}
            placeholder="Escreva uma mensagem"
            className="min-h-[44px] max-h-32 resize-none rounded-2xl bg-background py-2.5"
          />
          <button onClick={handleEnviar} disabled={!texto.trim()} aria-label="Enviar"
            className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 disabled:opacity-40 transition-opacity">
            <SendHorizontal className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Conversa;
