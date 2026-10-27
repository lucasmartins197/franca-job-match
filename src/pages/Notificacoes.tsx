import { useNavigate } from "react-router-dom";
import { Bell, UserPlus, CheckCircle2, Star, MessageSquare, Flag, Headset, BadgeDollarSign, Receipt, AlertTriangle, XCircle, Gift, KeyRound, CalendarCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DbNotificacao, useMarcarNotificacaoLida, useNotificacoes } from "@/hooks/useFrela";
import PageHeader from "@/components/frela/PageHeader";
import EmptyState from "@/components/frela/EmptyState";
import PageSkeleton from "@/components/frela/PageSkeleton";

const ICONES: Record<string, typeof Bell> = {
  candidatura: UserPlus,
  confirmacao: CheckCircle2,
  finalizacao: Flag,
  avaliacao: Star,
  mensagem: MessageSquare,
  suporte: Headset,
  confirmar_valor: BadgeDollarSign,
  taxa: Receipt,
  divergencia: AlertTriangle,
  cancelamento: XCircle,
  indicacao: Gift,
  // Fase 7
  codigo_gerado: KeyRound,
  digitar_codigo: KeyRound,
  avaliar: Star,
  vaga_disponivel: CalendarCheck,
};

const Notificacoes = () => {
  const navigate = useNavigate();
  const { data: notificacoes = [], isLoading } = useNotificacoes();
  const marcarLida = useMarcarNotificacaoLida();
  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  const abrir = (n: DbNotificacao) => {
    if (!n.lida) marcarLida.mutate(n.id);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="min-h-screen bg-background pb-12 max-w-lg mx-auto">
      <PageHeader
        title="Notificações"
        right={naoLidas > 0 && (
          <button onClick={() => marcarLida.mutate("todas")} className="text-xs text-primary font-medium shrink-0">
            Marcar todas como lidas
          </button>
        )}
      />

      <div className="px-5 space-y-2">
        {isLoading && <PageSkeleton variante="lista" comHeader={false} />}
        {!isLoading && notificacoes.length === 0 && (
          <EmptyState icon={Bell} titulo="Tudo em dia por aqui"
            descricao="Vagas nos seus dias disponíveis, candidaturas, códigos de confirmação, mensagens e avaliações aparecem aqui." />
        )}
        {notificacoes.map((n) => {
          const Icone = ICONES[n.tipo] ?? Bell;
          return (
            <button key={n.id} onClick={() => abrir(n)}
              className={`w-full text-left rounded-2xl p-4 border flex gap-3 transition-colors ${
                n.lida ? "bg-card border-border" : "bg-primary/5 border-primary/30"
              }`}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${n.lida ? "bg-muted" : "bg-primary/10"}`}>
                <Icone className={`h-4 w-4 ${n.lida ? "text-muted-foreground" : "text-primary"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${n.lida ? "text-muted-foreground" : "text-foreground font-medium"}`}>{n.texto}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                </p>
              </div>
              {!n.lida && <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Notificacoes;
