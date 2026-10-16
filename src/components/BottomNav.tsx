import { Home, Search, Briefcase, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  /** Contadores por aba (ex.: mensagens não lidas). */
  badges?: Partial<Record<string, number>>;
}

const tabs = [
  { id: "home", label: "Início", icon: Home },
  { id: "search", label: "Buscar", icon: Search },
  { id: "work", label: "Trabalhos", icon: Briefcase },
  { id: "messages", label: "Chat", icon: MessageCircle },
  { id: "profile", label: "Perfil", icon: User },
];

const BottomNav = ({ activeTab, onTabChange, badges = {} }: BottomNavProps) => (
  <nav className="fixed bottom-0 inset-x-0 bg-card/95 backdrop-blur-lg border-t border-border z-50 pb-safe">
    <div className="max-w-lg mx-auto grid grid-cols-5 h-16">
      {tabs.map((tab) => {
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
