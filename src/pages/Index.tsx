import { useState } from "react";
import OnboardingScreen from "@/components/OnboardingScreen";
import BottomNav from "@/components/BottomNav";
import HomeTab from "@/components/HomeTab";
import SearchTab from "@/components/SearchTab";
import PostJobTab from "@/components/PostJobTab";
import MessagesTab from "@/components/MessagesTab";
import ProfileTab from "@/components/ProfileTab";

const Index = () => {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [activeTab, setActiveTab] = useState("home");

  if (showOnboarding) {
    return <OnboardingScreen onComplete={() => setShowOnboarding(false)} />;
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
