import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import BottomNav from "@/components/BottomNav";
import HomeTab from "@/components/HomeTab";
import SearchTab from "@/components/SearchTab";
import PostJobTab from "@/components/PostJobTab";
import MessagesTab from "@/components/MessagesTab";
import ProfileTab from "@/components/ProfileTab";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [showPostModal, setShowPostModal] = useState(false);
  const { userTipo } = useAuth();
  const navigate = useNavigate();

  if (userTipo === "empresa") {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const handleTabChange = (tab: string) => {
    if (tab === "post") {
      setShowPostModal(true);
      return;
    }
    setActiveTab(tab);
  };

  const renderTab = () => {
    switch (activeTab) {
      case "home": return <HomeTab />;
      case "search": return <SearchTab />;
      case "messages": return <MessagesTab />;
      case "profile": return <ProfileTab />;
      default: return <HomeTab />;
    }
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto relative">
      {renderTab()}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      <Dialog open={showPostModal} onOpenChange={setShowPostModal}>
        <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-foreground">Nova Vaga</DialogTitle>
          </DialogHeader>
          <PostJobTab onClose={() => setShowPostModal(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
