import { Star, MapPin, Briefcase, Settings, ChevronRight, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { mockFreelancers } from "@/data/mockData";

const ProfileTab = () => {
  const user = mockFreelancers[0]; // Mock current user

  return (
    <div className="pb-20 pt-12 px-5">
      {/* Profile Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-brand flex items-center justify-center text-3xl font-bold text-primary-foreground shadow-brand">
          {user.name.charAt(0)}
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-foreground">{user.name}</h1>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span>{user.neighborhood}, Franca</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-0.5">
              <Star className="h-3.5 w-3.5 fill-brand-orange text-brand-orange" />
              <span className="text-sm font-bold text-foreground">{user.rating}</span>
            </div>
            <span className="text-xs text-muted-foreground">({user.reviewCount} avaliações)</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-card rounded-2xl p-3 text-center border border-border/50 shadow-card">
          <div className="text-xl font-extrabold text-primary">{user.jobsCompleted}</div>
          <div className="text-[10px] text-muted-foreground font-medium">Trabalhos</div>
        </div>
        <div className="bg-card rounded-2xl p-3 text-center border border-border/50 shadow-card">
          <div className="text-xl font-extrabold text-brand-orange">{user.rating}</div>
          <div className="text-[10px] text-muted-foreground font-medium">Rating</div>
        </div>
        <div className="bg-card rounded-2xl p-3 text-center border border-border/50 shadow-card">
          <div className="text-xl font-extrabold text-brand-green">{user.skills.length}</div>
          <div className="text-[10px] text-muted-foreground font-medium">Habilidades</div>
        </div>
      </div>

      {/* Bio */}
      <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-card mb-4">
        <h3 className="font-bold text-foreground text-sm mb-2">Sobre mim</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{user.bio}</p>
      </div>

      {/* Skills */}
      <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-card mb-4">
        <h3 className="font-bold text-foreground text-sm mb-3">Habilidades</h3>
        <div className="flex flex-wrap gap-2">
          {user.skills.map((skill) => (
            <Badge key={skill} className="bg-brand-blue-light text-primary font-semibold border-0 rounded-lg px-3 py-1">
              {skill}
            </Badge>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <div className="space-y-2">
        {[
          { icon: Calendar, label: "Disponibilidade", desc: "Configurar dias e horários" },
          { icon: Briefcase, label: "Meus Trabalhos", desc: "Histórico de trabalhos" },
          { icon: Star, label: "Avaliações", desc: "Ver todas as avaliações" },
          { icon: Settings, label: "Configurações", desc: "Conta, notificações, pagamento" },
        ].map((item) => (
          <button
            key={item.label}
            className="w-full flex items-center gap-3 p-4 bg-card rounded-2xl border border-border/50 shadow-card hover:shadow-card-hover transition-shadow"
          >
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <item.icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <span className="font-semibold text-foreground text-sm">{item.label}</span>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProfileTab;
