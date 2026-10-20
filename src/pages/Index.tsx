import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useChatNaoLidas } from "@/hooks/useChat";
import { useMeuPerfil } from "@/hooks/usePerfil";
import BottomNav from "@/components/BottomNav";
import HomeTab from "@/components/HomeTab";
import SearchTab from "@/components/SearchTab";
import MyWorkTab from "@/components/MyWorkTab";
import MessagesTab from "@/components/MessagesTab";
import ProfileTab from "@/components/ProfileTab";

const TABS = ["home", "search", "work", "messages", "profile"];

/** Área do profissional (feed + abas). Empresas são mandadas para o painel. */
const Index = () => {
  const { userTipo } = useAuth();
  const navigate = useNavigate();
  const chatNaoLidas = useChatNaoLidas();
  const { data: perfil } = useMeuPerfil();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") ?? "home";
  const activeTab = TABS.includes(tabParam) ? tabParam : "home";

  if (userTipo === "empresa") return <Navigate to="/dashboard" replace />;

  const handleTabChange = (tab: string) => {
    if (tab === "gestao") return navigate("/gestao");
    setSearchParams(tab === "home" ? {} : { tab }, { replace: true });
    window.scrollTo(0, 0);
  };

  const renderTab = () => {
    switch (activeTab) {
      case "search": return <SearchTab />;
      case "work": return <MyWorkTab />;
      case "messages": return <MessagesTab />;
      case "profile":
        return (
          <>
            <div className="px-5 pt-12">
              <h1 className="text-2xl font-display font-bold text-foreground">Meu perfil</h1>
            </div>
            <ProfileTab />
          </>
        );
      default: return <HomeTab />;
    }
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto relative">
      {renderTab()}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} badges={{ messages: chatNaoLidas }} mostrarGestao={!!perfil?.profile.is_admin} />
    </div>
  );
};

export default Index;
