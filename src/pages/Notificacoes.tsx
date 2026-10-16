import { useNavigate } from "react-router-dom";
import { Bell, Loader2, UserPlus, CheckCircle2, Star, MessageSquare, Flag } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DbNotificacao, useMarcarNotificacaoLida, useNotificacoes } from "@/hooks/useFrela";
import PageHeader from "@/components/frela/PageHeader";

const ICONES: Record<string, typeof Bell> = {
  candidatura: UserPlus,
  confirmacao: CheckCircle2,
  finalizacao: Flag,
  avaliacao: Star,
  mensagem: MessageSquare,
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
        {isLoading && <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
        {!isLoading && notificacoes.length === 0 && (
          <div className="flex flex-col items-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center mb-4">
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">Nenhuma notificação</p>
          </div>
        )}
        {notificacoes.map((n) => {
          const Icone = ICONES[n.tipo] ?? Bell;
          return (
            <button key={n.id} onClick={() => abrir(n)}
              className={`w-full text-left rounded-xl p-4 border flex gap-3 transition-colors ${
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
