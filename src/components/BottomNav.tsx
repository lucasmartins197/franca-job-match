import { Home, Search, Plus, MessageSquare, User } from "lucide-react";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "home", label: "Início", icon: Home },
  { id: "search", label: "Buscar", icon: Search },
  { id: "post", label: "Publicar", icon: Plus },
  { id: "messages", label: "Chat", icon: MessageSquare },
  { id: "profile", label: "Perfil", icon: User },
];

const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isPost = tab.id === "post";

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center gap-0.5 min-w-0 px-3 py-1 rounded-xl transition-all ${
                isPost
                  ? ""
                  : isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {isPost ? (
                <div className="w-12 h-12 -mt-5 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-brand">
                  <Plus className="h-6 w-6 text-primary-foreground" />
                </div>
              ) : (
                <>
                  <tab.icon className={`h-5 w-5 ${isActive ? "stroke-[2.5]" : ""}`} />
                  <span className="text-[10px] font-semibold">{tab.label}</span>
                </>
              )}
            </button>
          );
        })}
      </div>
      <div className="h-safe-area-inset-bottom bg-card" />
    </nav>
  );
};

export default BottomNav;
