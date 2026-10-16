import { MessageSquare } from "lucide-react";

// TODO (Fase 2): lista de conversas por contratação (tabela `mensagens`).
const MessagesTab = () => (
  <div className="pb-20 pt-12 px-5">
    <h1 className="text-2xl font-display font-bold text-foreground mb-6">Mensagens</h1>
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center mb-4">
        <MessageSquare className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground font-medium">Chat em breve</p>
      <p className="text-sm text-muted-foreground/60 mt-1">Você poderá conversar com a empresa de cada contratação aqui.</p>
    </div>
  </div>
);

export default MessagesTab;
