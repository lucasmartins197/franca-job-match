import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Headset, MessageSquareText, Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMeuPerfil } from "@/hooks/usePerfil";
import { useEnviarSuporte } from "@/hooks/useSuporte";
import { CaixaMensagem } from "@/components/chat/ChatParts";
import {
  MENSAGENS, NOME_APP, NOME_ASSISTENTE, PRAZO_RESPOSTA, SAUDACAO, TipoUsuario, Topico, detectarIntencao, preencher, topicosPara,
} from "@/lib/suporteFaq";
import { cn } from "@/lib/utils";

/** O que aparece embaixo de uma mensagem da Vera */
type Extra = "chips" | "ajudou" | "escalar" | "verTime";

interface Msg {
  id: string;
  de: "vera" | "eu";
  texto: string;
  extra?: Extra;
  /** "Isso ajudou?" já respondido */
  respondida?: boolean;
}

let seq = 0;
const novoId = () => `m${++seq}`;

/** Tempo de "digitando…": curto, mas proporcional ao tamanho da resposta. */
const atraso = (texto: string) => 450 + Math.min(1300, texto.length * 9);

export const AvatarVera = ({ size = "md" }: { size?: "sm" | "md" }) => (
  <span className={cn("relative shrink-0 rounded-full bg-gradient-to-br from-primary to-brand-light text-primary-foreground flex items-center justify-center shadow-brand",
    size === "sm" ? "w-8 h-8" : "w-10 h-10")} aria-hidden>
    <span className={cn("font-display font-extrabold", size === "sm" ? "text-sm" : "text-base")}>{NOME_ASSISTENTE.charAt(0)}</span>
    <Sparkles className={cn("absolute -top-0.5 -right-0.5 text-amber-300 fill-amber-300", size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} />
  </span>
);

const Digitando = () => (
  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-end gap-2" role="status" aria-label={`${NOME_ASSISTENTE} está digitando`}>
    <AvatarVera size="sm" />
    <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-card border border-border flex gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span key={i} className="w-2 h-2 rounded-full bg-muted-foreground/60"
          animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }} />
      ))}
    </div>
  </motion.div>
);

interface Props {
  /** Abre a conversa com o time (mensagens do suporte humano) */
  onVerTime: () => void;
  /** Quantas mensagens já existem com o time (para o atalho) */
  mensagensTime: number;
  naoLidasTime: number;
}

/**
 * Assistente de suporte "Vera" — IA SIMULADA: respostas programadas em
 * src/lib/suporteFaq.ts, detecção de intenção por palavras-chave, sem IA externa.
 * Se não resolver, escala para o suporte humano que já existe (suporte_mensagens).
 */
const AssistenteVera = ({ onVerTime, mensagensTime, naoLidasTime }: Props) => {
  const { user, userTipo } = useAuth();
  const { data: perfil } = useMeuPerfil();
  const enviarSuporte = useEnviarSuporte(user?.id);
  const tipo: TipoUsuario = userTipo === "empresa" ? "empresa" : "profissional";
  const topicos = topicosPara(tipo);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [digitando, setDigitando] = useState(false);
  const [escalando, setEscalando] = useState(false);
  const fila = useRef<number[]>([]);
  const fim = useRef<HTMLDivElement>(null);
  const iniciou = useRef(false);

  const nome = perfil?.profile.nome;

  useEffect(() => () => fila.current.forEach(clearTimeout), []);
  useEffect(() => {
    fim.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, digitando]);

  /** A Vera "digita" e depois manda a mensagem. */
  const veraDiz = useCallback((texto: string, extra?: Extra) => {
    setDigitando(true);
    const t = window.setTimeout(() => {
      setDigitando(false);
      setMsgs((m) => [...m, { id: novoId(), de: "vera", texto, extra }]);
    }, atraso(texto));
    fila.current.push(t);
  }, []);

  const euDigo = (texto: string) => setMsgs((m) => [...m, { id: novoId(), de: "eu", texto }]);

  // Saudação (espera o perfil para usar o nome)
  useEffect(() => {
    if (iniciou.current || (!perfil && user)) return;
    iniciou.current = true;
    veraDiz(preencher(SAUDACAO[tipo], nome), "chips");
  }, [perfil, user, tipo, nome, veraDiz]);

  const responder = (topico: Topico) => veraDiz(preencher(topico.resposta), "ajudou");

  const escolher = (topico: Topico) => {
    if (digitando) return;
    setEscalando(false);
    euDigo(preencher(topico.pergunta));
    responder(topico);
  };

  const escalar = () => {
    if (digitando) return;
    euDigo(MENSAGENS.botaoEscalar);
    setEscalando(true);
    veraDiz(preencher(MENSAGENS.escalarPedido));
  };

  const marcar = (id: string) => setMsgs((m) => m.map((x) => (x.id === id ? { ...x, respondida: true } : x)));

  const ajudou = (msg: Msg, sim: boolean) => {
    marcar(msg.id);
    euDigo(sim ? "Sim, ajudou!" : "Não ajudou");
    veraDiz(preencher(sim ? MENSAGENS.ajudouSim : MENSAGENS.ajudouNao), sim ? "chips" : "escalar");
  };

  const enviarTexto = async (texto: string) => {
    euDigo(texto);
    if (escalando) {
      try {
        await enviarSuporte.mutateAsync(texto);
        setEscalando(false);
        veraDiz(preencher(MENSAGENS.escalarEnviado), "verTime");
      } catch {
        veraDiz(MENSAGENS.escalarErro, "escalar");
      }
      return;
    }
    const topico = detectarIntencao(texto, tipo);
    if (topico) responder(topico);
    else veraDiz(preencher(MENSAGENS.naoEntendi), "chips");
  };

  const ultimaVera = [...msgs].reverse().find((m) => m.de === "vera");

  const chip = (t: Topico, compacto?: boolean) => (
    <motion.button key={t.id} whileTap={{ scale: 0.96 }} onClick={() => escolher(t)} disabled={digitando}
      className={cn("rounded-full border border-primary/30 bg-primary/5 text-primary font-medium text-left transition-colors hover:bg-primary/10 disabled:opacity-50",
        compacto ? "shrink-0 h-8 px-3 text-xs whitespace-nowrap" : "max-w-full px-3.5 py-2 text-sm leading-snug")}>
      {preencher(t.pergunta)}
    </motion.button>
  );

  return (
    <>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" aria-live="polite">
        {mensagensTime > 0 && (
          <button onClick={onVerTime}
            className={cn("w-full rounded-2xl border p-3 flex items-center gap-3 text-left text-sm",
              naoLidasTime > 0 ? "border-primary bg-primary/5" : "border-border bg-card")}>
            <span className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0"><Headset className="h-4 w-4" /></span>
            <span className="flex-1 min-w-0">
              <span className="block font-semibold text-foreground">Sua conversa com o time</span>
              <span className="block text-xs text-muted-foreground">
                {naoLidasTime > 0 ? `${naoLidasTime} resposta${naoLidasTime === 1 ? "" : "s"} nova${naoLidasTime === 1 ? "" : "s"}` : "Ver mensagens e respostas"}
              </span>
            </span>
            {naoLidasTime > 0 && <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-destructive text-white text-[11px] font-bold flex items-center justify-center">{naoLidasTime}</span>}
          </button>
        )}

        <AnimatePresence initial={false}>
          {msgs.map((m) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}
              className={cn("flex gap-2", m.de === "eu" ? "justify-end" : "items-start")}>
              {m.de === "vera" && <AvatarVera size="sm" />}
              <div className={cn("max-w-[85%]", m.de === "eu" && "flex flex-col items-end")}>
                <div className={cn("px-3.5 py-2.5 rounded-2xl text-[15px] leading-relaxed shadow-sm whitespace-pre-line",
                  m.de === "eu" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-card border border-border text-foreground rounded-bl-md")}>
                  {m.texto}
                </div>

                {m.extra === "chips" && m.id === ultimaVera?.id && <div className="flex flex-wrap gap-2 mt-2.5">{topicos.map((t) => chip(t))}</div>}

                {m.extra === "ajudou" && !m.respondida && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-muted-foreground">{MENSAGENS.perguntaAjudou}</span>
                    <button onClick={() => ajudou(m, true)} className="h-8 px-3 rounded-full border border-border bg-card text-xs font-semibold inline-flex items-center gap-1 hover:border-primary/40">
                      <ThumbsUp className="h-3.5 w-3.5 text-primary" /> Sim
                    </button>
                    <button onClick={() => ajudou(m, false)} className="h-8 px-3 rounded-full border border-border bg-card text-xs font-semibold inline-flex items-center gap-1 hover:border-primary/40">
                      <ThumbsDown className="h-3.5 w-3.5 text-muted-foreground" /> Não
                    </button>
                  </div>
                )}

                {m.extra === "escalar" && m.id === ultimaVera?.id && !escalando && (
                  <button onClick={escalar} className="mt-2 h-9 px-3.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-1.5 shadow-brand">
                    <Headset className="h-4 w-4" /> {MENSAGENS.botaoEscalar}
                  </button>
                )}

                {m.extra === "verTime" && (
                  <button onClick={onVerTime} className="mt-2 h-9 px-3.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-semibold inline-flex items-center gap-1.5">
                    <MessageSquareText className="h-4 w-4" /> Ver conversa com o time
                  </button>
                )}
              </div>
            </motion.div>
          ))}
          {digitando && <Digitando key="digitando" />}
        </AnimatePresence>
        <div ref={fim} />
      </div>

      <div className="border-t border-border bg-card">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar px-3 py-2" aria-label="Dúvidas comuns">
          <button onClick={escalar} disabled={digitando || escalando}
            className="shrink-0 h-8 px-3 rounded-full bg-foreground text-background text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50">
            <Headset className="h-3.5 w-3.5" /> {MENSAGENS.botaoEscalar}
          </button>
          {topicos.map((t) => chip(t, true))}
        </div>
        {escalando && (
          <p className="px-4 -mt-1 pb-1 text-[11px] text-muted-foreground">
            Sua mensagem vai para o time do {NOME_APP} · resposta em até {PRAZO_RESPOSTA}.{" "}
            <button onClick={() => setEscalando(false)} className="font-semibold text-primary">Cancelar</button>
          </p>
        )}
      </div>
      <CaixaMensagem onEnviar={enviarTexto} placeholder={escalando ? "Conte para o time o que você precisa" : `Pergunte para a ${NOME_ASSISTENTE}...`} />
    </>
  );
};

export default AssistenteVera;
