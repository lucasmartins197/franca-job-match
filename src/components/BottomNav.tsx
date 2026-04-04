import { Home, Search, Plus, MessageSquare, User } from "lucide-react";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "home", label: "Início", icon: Home },
  { id: "search", label: "Buscar", icon: Search },
  { id: "post", label: "", icon: Plus },
  { id: "messages", label: "Chat", icon: MessageSquare },
  { id: "profile", label: "Perfil", icon: User },
];

const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => (
  <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-50">
    <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-2">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const isPost = tab.id === "post";
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center gap-0.5 min-w-0 px-3 py-1 transition-all ${
              isPost ? "" : isActive ? "text-gold" : "text-muted-foreground"
            }`}
          >
            {isPost ? (
              <div className="w-12 h-12 -mt-5 rounded-xl gradient-gold flex items-center justify-center shadow-gold">
                <Plus className="h-6 w-6 text-background" />
              </div>
            ) : (
              <>
                <tab.icon className={`h-5 w-5 ${isActive ? "stroke-[2.5]" : ""}`} />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </>
            )}
          </button>
        );
      })}
    </div>
  </nav>
);

export default BottomNav;
