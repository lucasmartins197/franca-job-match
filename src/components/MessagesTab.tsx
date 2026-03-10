import { MessageSquare } from "lucide-react";

const messagesData = [
  { id: "1", name: "Choperia do Zé", lastMsg: "Olá! Você está confirmado para sexta.", time: "10:30", unread: 1, emoji: "🍺" },
  { id: "2", name: "Buffet Encanto", lastMsg: "Precisamos confirmar o horário.", time: "Ontem", unread: 0, emoji: "🎂" },
  { id: "3", name: "Shopping Franca", lastMsg: "A ação será no piso L2. Chegar 30min antes.", time: "Seg", unread: 2, emoji: "🛍️" },
];

const MessagesTab = () => {
  return (
    <div className="pb-20 pt-12 px-5">
      <h1 className="text-2xl font-extrabold text-foreground mb-6">Mensagens</h1>

      <div className="space-y-2">
        {messagesData.map((msg) => (
          <button
            key={msg.id}
            className="w-full flex items-center gap-3 p-4 bg-card rounded-2xl border border-border/50 shadow-card hover:shadow-card-hover transition-shadow text-left"
          >
            <div className="w-12 h-12 rounded-2xl bg-brand-blue-light flex items-center justify-center text-xl shrink-0">
              {msg.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground truncate">{msg.name}</span>
                <span className="text-xs text-muted-foreground shrink-0 ml-2">{msg.time}</span>
              </div>
              <p className="text-sm text-muted-foreground truncate">{msg.lastMsg}</p>
            </div>
            {msg.unread > 0 && (
              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-primary-foreground">{msg.unread}</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {messagesData.length === 0 && (
        <div className="text-center py-20">
          <MessageSquare className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">Nenhuma mensagem</p>
        </div>
      )}
    </div>
  );
};

export default MessagesTab;
