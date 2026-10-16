import ProfileTab from "@/components/ProfileTab";
import PageHeader from "@/components/frela/PageHeader";

const Profile = () => (
  <div className="min-h-screen bg-background max-w-lg mx-auto">
    <PageHeader title="Meu perfil" />
    <ProfileTab />
  </div>
);

export default Profile;
