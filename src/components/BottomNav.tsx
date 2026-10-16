import { Home, Search, Briefcase, MessageSquare, User } from "lucide-react";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "home", label: "Início", icon: Home },
  { id: "search", label: "Buscar", icon: Search },
  { id: "work", label: "Trabalhos", icon: Briefcase },
  { id: "messages", label: "Chat", icon: MessageSquare },
  { id: "profile", label: "Perfil", icon: User },
];

const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => (
  <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-50">
    <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-2">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center gap-0.5 min-w-0 px-3 py-1 transition-all ${
              isActive ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <tab.icon className={`h-5 w-5 ${isActive ? "stroke-[2.5]" : ""}`} />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        );
      })}
    </div>
  </nav>
);

export default BottomNav;
