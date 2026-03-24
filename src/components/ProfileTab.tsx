import { useState, useEffect } from "react";
import { Star, MapPin, Settings, ChevronRight, Calendar, Briefcase, LogOut, Save, Edit2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { SKILLS } from "@/data/mockData";

const ProfileTab = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [nome, setNome] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [rating, setRating] = useState(0);
  const [jobsCompleted, setJobsCompleted] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data }) => {
      if (data) {
        setNome(data.nome || "");
        setBio((data as any).bio || "");
        setPhone((data as any).phone || "");
        setNeighborhood((data as any).neighborhood || "");
        setSkills((data as any).skills || []);
        setRating((data as any).rating || 0);
        setJobsCompleted((data as any).jobs_completed || 0);
      }
      setLoading(false);
    });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({
      nome,
      bio,
      phone,
      neighborhood,
      skills,
    } as any).eq("id", user.id);
    if (error) {
      toast.error("Erro ao salvar perfil");
    } else {
      toast.success("Perfil atualizado!");
      setEditing(false);
    }
  };

  const toggleSkill = (skill: string) => {
    setSkills((prev) => prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (loading) return <div className="pb-20 pt-12 px-5 text-center text-muted-foreground">Carregando...</div>;

  return (
    <div className="pb-20 pt-12 px-5">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-3xl bg-gradient-brand flex items-center justify-center text-3xl font-bold text-primary-foreground shadow-brand">
            {nome.charAt(0) || "?"}
          </div>
          <div>
            {editing ? (
              <Input value={nome} onChange={(e) => setNome(e.target.value)} className="h-9 rounded-lg font-bold text-lg mb-1" />
            ) : (
              <h1 className="text-xl font-extrabold text-foreground">{nome || "Sem nome"}</h1>
            )}
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {editing ? (
                <Input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Bairro" className="h-7 text-xs w-32" />
              ) : (
                <span>{neighborhood || "Franca, SP"}</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`h-3.5 w-3.5 ${s <= Math.round(rating) ? "fill-accent text-accent" : "text-muted-foreground/30"}`} />
                ))}
              </div>
              <span className="text-sm font-bold text-foreground">{rating.toFixed(1)}</span>
            </div>
          </div>
        </div>
        <button onClick={() => editing ? handleSave() : setEditing(true)} className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          {editing ? <Save className="h-5 w-5 text-primary" /> : <Edit2 className="h-5 w-5 text-primary" />}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-card rounded-2xl p-3 text-center border border-border/50 shadow-card">
          <div className="text-xl font-extrabold text-primary">{jobsCompleted}</div>
          <div className="text-[10px] text-muted-foreground font-medium">Trabalhos</div>
        </div>
        <div className="bg-card rounded-2xl p-3 text-center border border-border/50 shadow-card">
          <div className="text-xl font-extrabold text-accent">{rating.toFixed(1)}</div>
          <div className="text-[10px] text-muted-foreground font-medium">Rating</div>
        </div>
        <div className="bg-card rounded-2xl p-3 text-center border border-border/50 shadow-card">
          <div className="text-xl font-extrabold text-brand-green">{skills.length}</div>
          <div className="text-[10px] text-muted-foreground font-medium">Habilidades</div>
        </div>
      </div>

      <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-card mb-4">
        <h3 className="font-bold text-foreground text-sm mb-2">Sobre mim</h3>
        {editing ? (
          <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Conte sobre sua experiência..." className="rounded-xl" />
        ) : (
          <p className="text-sm text-muted-foreground leading-relaxed">{bio || "Nenhuma descrição ainda."}</p>
        )}
      </div>

      {editing && (
        <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-card mb-4">
          <h3 className="font-bold text-foreground text-sm mb-2">Telefone</h3>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(16) 99999-0000" className="rounded-xl" />
        </div>
      )}

      <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-card mb-4">
        <h3 className="font-bold text-foreground text-sm mb-3">Habilidades</h3>
        <div className="flex flex-wrap gap-2">
          {editing ? (
            SKILLS.map((skill) => (
              <Badge
                key={skill}
                onClick={() => toggleSkill(skill)}
                className={`cursor-pointer px-3 py-1 rounded-lg font-semibold border-0 transition-all ${
                  skills.includes(skill) ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                }`}
              >
                {skill}
              </Badge>
            ))
          ) : (
            skills.length > 0 ? skills.map((skill) => (
              <Badge key={skill} className="bg-brand-blue-light text-primary font-semibold border-0 rounded-lg px-3 py-1">{skill}</Badge>
            )) : <p className="text-sm text-muted-foreground">Nenhuma habilidade selecionada</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {[
          { icon: Calendar, label: "Disponibilidade", desc: "Configurar dias e horários" },
          { icon: Briefcase, label: "Meus Trabalhos", desc: "Histórico de trabalhos" },
          { icon: Star, label: "Avaliações", desc: "Ver todas as avaliações" },
          { icon: Settings, label: "Configurações", desc: "Conta, notificações, pagamento" },
        ].map((item) => (
          <button key={item.label} className="w-full flex items-center gap-3 p-4 bg-card rounded-2xl border border-border/50 shadow-card hover:shadow-card-hover transition-shadow">
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

        <button onClick={handleSignOut} className="w-full flex items-center gap-3 p-4 bg-card rounded-2xl border border-destructive/20 shadow-card hover:shadow-card-hover transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <LogOut className="h-5 w-5 text-destructive" />
          </div>
          <div className="flex-1 text-left">
            <span className="font-semibold text-destructive text-sm">Sair</span>
            <p className="text-xs text-muted-foreground">Encerrar sessão</p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default ProfileTab;
