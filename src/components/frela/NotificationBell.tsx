import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotificacoes } from "@/hooks/useFrela";

const NotificationBell = () => {
  const navigate = useNavigate();
  const { data: notificacoes = [] } = useNotificacoes();
  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  return (
    <button
      onClick={() => navigate("/notificacoes")}
      aria-label={naoLidas > 0 ? `Notificações (${naoLidas} não lidas)` : "Notificações"}
      className="relative w-10 h-10 bg-card border border-border rounded-xl flex items-center justify-center shadow-sm"
    >
      <Bell className="h-5 w-5 text-muted-foreground" />
      {naoLidas > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
          {naoLidas > 9 ? "9+" : naoLidas}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;
