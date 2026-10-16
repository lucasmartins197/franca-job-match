import ConversasList from "@/components/chat/ConversasList";
import NotificationBell from "@/components/frela/NotificationBell";

const MessagesTab = () => (
  <div className="pb-24 pt-10 px-5">
    <div className="flex items-center justify-between mb-5">
      <h1 className="text-2xl font-display font-bold text-foreground">Conversas</h1>
      <NotificationBell />
    </div>
    <ConversasList />
  </div>
);

export default MessagesTab;
