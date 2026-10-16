import { Fragment, ReactNode, useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, SendHorizontal } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface MsgBolha {
  id: string;
  texto: string;
  created_at: string;
  minha: boolean;
  lida?: boolean;
  /** Nome exibido acima da bolha (ex.: atendente do suporte) */
  autor?: string;
}

const rotuloDia = (iso: string) => {
  const d = new Date(iso);
  const hoje = new Date();
  if (d.toDateString() === hoje.toDateString()) return "Hoje";
  if (d.toDateString() === new Date(hoje.getTime() - 86_400_000).toDateString()) return "Ontem";
  return d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "long" });
};

/** Lista de mensagens com separador por dia e rolagem automática. */
export const ListaMensagens = ({ mensagens, carregando, vazio }: { mensagens: MsgBolha[]; carregando?: boolean; vazio?: ReactNode }) => {
  const fim = useRef<HTMLDivElement>(null);
  useEffect(() => {
    fim.current?.scrollIntoView({ behavior: mensagens.length > 30 ? "auto" : "smooth" });
  }, [mensagens.length]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      {carregando ? (
        <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : mensagens.length === 0 ? (
        vazio
      ) : (
        <div className="space-y-1.5">
          {mensagens.map((m, i) => {
            const anterior = mensagens[i - 1];
            const novoDia = !anterior || new Date(anterior.created_at).toDateString() !== new Date(m.created_at).toDateString();
            const agrupada = !novoDia && anterior?.minha === m.minha && anterior?.autor === m.autor;
            const pendente = m.id.startsWith("tmp-");
            return (
              <Fragment key={m.id}>
                {novoDia && (
                  <div className="flex justify-center py-2">
                    <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">{rotuloDia(m.created_at)}</span>
                  </div>
                )}
                <div className={cn("flex flex-col", m.minha ? "items-end" : "items-start", !agrupada && "pt-1.5")}>
                  {m.autor && !agrupada && <span className="text-[11px] font-semibold text-primary mb-0.5 px-1">{m.autor}</span>}
                  <div className={cn(
                    "max-w-[80%] px-3.5 py-2 rounded-2xl text-[15px] leading-snug shadow-sm",
                    m.minha ? "bg-primary text-primary-foreground rounded-br-md" : "bg-card border border-border text-foreground rounded-bl-md",
                    pendente && "opacity-70"
                  )}>
                    <p className="whitespace-pre-wrap break-words">{m.texto}</p>
                    <p className={cn("text-[10px] mt-0.5 text-right", m.minha ? "text-primary-foreground/70" : "text-muted-foreground")}>
                      {pendente ? "enviando…" : new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      {m.minha && !pendente && m.lida ? " · lida" : ""}
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
  );
};

/** Caixa de texto + botão enviar. Enter envia, Shift+Enter quebra linha. */
export const CaixaMensagem = ({ onEnviar, aviso, placeholder = "Escreva uma mensagem" }: {
  onEnviar: (texto: string) => Promise<void>;
  aviso?: ReactNode;
  placeholder?: string;
}) => {
  const [texto, setTexto] = useState("");

  const enviar = async () => {
    const t = texto.trim();
    if (!t) return;
    setTexto("");
    try {
      await onEnviar(t);
    } catch {
      setTexto(t);
    }
  };

  return (
    <div className="border-t border-border bg-card px-3 py-2.5 pb-safe">
      {aviso}
      <div className="flex items-end gap-2">
        <Textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void enviar();
            }
          }}
          rows={1}
          maxLength={2000}
          placeholder={placeholder}
          className="min-h-[44px] max-h-32 resize-none rounded-2xl bg-background py-2.5"
        />
        <button onClick={enviar} disabled={!texto.trim()} aria-label="Enviar"
          className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 disabled:opacity-40 transition-opacity">
          <SendHorizontal className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

/** Cabeçalho de tela de chat. */
export const CabecalhoChat = ({ onVoltar, children, direita }: { onVoltar: () => void; children: ReactNode; direita?: ReactNode }) => (
  <header className="flex items-center gap-3 px-3 pt-8 pb-3 border-b border-border bg-card/95 backdrop-blur">
    <button onClick={onVoltar} aria-label="Voltar" className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-muted">
      <ArrowLeft className="h-5 w-5" />
    </button>
    <div className="flex-1 min-w-0">{children}</div>
    {direita}
  </header>
);
