import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import BottomNav from "@/components/BottomNav";
import HomeTab from "@/components/HomeTab";
import SearchTab from "@/components/SearchTab";
import PostJobTab from "@/components/PostJobTab";
import MessagesTab from "@/components/MessagesTab";
import ProfileTab from "@/components/ProfileTab";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const { userTipo } = useAuth();
  const navigate = useNavigate();

  // Empresa users should use dashboard
  if (userTipo === "empresa") {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const renderTab = () => {
    switch (activeTab) {
      case "home": return <HomeTab />;
      case "search": return <SearchTab />;
      case "post": return <PostJobTab />;
      case "messages": return <MessagesTab />;
      case "profile": return <ProfileTab />;
      default: return <HomeTab />;
    }
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto relative">
      {renderTab()}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
