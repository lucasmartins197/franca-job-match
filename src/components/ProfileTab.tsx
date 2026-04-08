import { useState, useEffect } from "react";
import { Star, LogOut, Edit2, Save, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const ProfileTab = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [nome, setNome] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [rating, setRating] = useState(0);
  const [jobsCompleted, setJobsCompleted] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data }) => {
      if (data) {
        setNome(data.nome || "");
        setBio(data.bio || "");
        setPhone(data.phone || "");
        setRating(data.rating || 0);
        setJobsCompleted(data.jobs_completed || 0);
      }
      setLoading(false);
    });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ nome, bio, phone }).eq("id", user.id);
    setSaving(false);
    if (error) toast.error("Erro ao salvar");
    else { toast.success("Perfil atualizado!"); setEditing(false); }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString("pt-BR", { month: "long", year: "numeric" }) : "";

  if (loading) return <div className="pb-20 pt-12 px-5 text-center text-muted-foreground">Carregando...</div>;

  return (
    <div className="pb-20 pt-12 px-5">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-20 h-20 rounded-2xl gradient-brand flex items-center justify-center text-3xl font-display font-bold text-primary-foreground shadow-brand">
          {nome.charAt(0) || "?"}
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-display font-bold text-foreground">{nome || "Sem nome"}</h1>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          <div className="flex items-center gap-1 mt-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className={`h-4 w-4 ${s <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-border"}`} />
            ))}
            <span className="text-sm font-medium text-primary ml-1">{rating.toFixed(1)}</span>
          </div>
        </div>
        <button onClick={() => editing ? handleSave() : setEditing(true)}
          className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center shadow-sm">
          {saving ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : editing ? <Save className="h-4 w-4 text-primary" /> : <Edit2 className="h-4 w-4 text-muted-foreground" />}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Trabalhos", value: jobsCompleted },
          { label: "Avaliação", value: rating.toFixed(1) },
          { label: "Membro desde", value: memberSince },
        ].map((stat) => (
          <div key={stat.label} className="bg-card rounded-xl p-3 text-center border border-border shadow-sm">
            <div className="text-lg font-display font-bold text-primary">{stat.value}</div>
            <div className="text-[10px] text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="space-y-4 mb-6">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Nome</label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} className="bg-card border-border rounded-xl" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Telefone</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(16) 99999-0000" className="bg-card border-border rounded-xl" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Bio</label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Conte sobre você..." className="bg-card border-border rounded-xl min-h-[80px]" />
          </div>
        </div>
      )}

      {!editing && bio && (
        <div className="bg-card rounded-xl p-4 border border-border mb-6 shadow-sm">
          <h3 className="font-display font-bold text-foreground text-sm mb-2">Sobre</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{bio}</p>
        </div>
      )}

      <Button onClick={handleSignOut} variant="outline"
        className="w-full h-12 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 font-medium">
        <LogOut className="h-4 w-4 mr-2" /> Sair da conta
      </Button>
    </div>
  );
};

export default ProfileTab;
