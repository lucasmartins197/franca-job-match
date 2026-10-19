import { Home, Search, Briefcase, MessageCircle, User, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  /** Contadores por aba (ex.: mensagens não lidas). */
  badges?: Partial<Record<string, number>>;
  /** Mostra o atalho "Gestão" (só ADM); o clique chega como onTabChange("gestao"). */
  mostrarGestao?: boolean;
}

const tabs = [
  { id: "home", label: "Início", icon: Home },
  { id: "search", label: "Buscar", icon: Search },
  { id: "work", label: "Trabalhos", icon: Briefcase },
  { id: "messages", label: "Chat", icon: MessageCircle },
  { id: "profile", label: "Perfil", icon: User },
];

const gestaoTab = { id: "gestao", label: "Gestão", icon: LayoutDashboard };

const BottomNav = ({ activeTab, onTabChange, badges = {}, mostrarGestao = false }: BottomNavProps) => (
  <nav className="fixed bottom-0 inset-x-0 bg-card/95 backdrop-blur-lg border-t border-border z-50 pb-safe">
    <div className={cn("max-w-lg mx-auto grid h-16", mostrarGestao ? "grid-cols-6" : "grid-cols-5")}>
      {(mostrarGestao ? [...tabs, gestaoTab] : tabs).map((tab) => {
        const isActive = activeTab === tab.id;
        const badge = badges[tab.id] ?? 0;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            aria-current={isActive ? "page" : undefined}
            className={cn("relative flex flex-col items-center justify-center gap-1 transition-colors", isActive ? "text-primary" : "text-muted-foreground")}
          >
            {isActive && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" />}
            <span className="relative">
              <tab.icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
              {badge > 0 && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-[10px] font-bold text-white flex items-center justify-center">
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
            </span>
            <span className={cn("text-[11px]", isActive ? "font-semibold" : "font-medium")}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  </nav>
);

export default BottomNav;
