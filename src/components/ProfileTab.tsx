import { useState, useEffect } from "react";
import { LogOut, Edit2, Save, Loader2, X } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useMyProfile, useMinhasContratacoes, useAvaliacoesRecebidas } from "@/hooks/useFrela";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import Stars from "@/components/frela/Stars";

const ProfileTab = () => {
  const { user, signOut, userTipo } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEmpresa = userTipo === "empresa";
  const { data: profile, isLoading } = useMyProfile();
  const { data: contratacoes = [] } = useMinhasContratacoes();
  const { data: avaliacoes = [] } = useAvaliacoesRecebidas(user?.id);

  const { data: extras, isLoading: loadingExtras } = useQuery({
    queryKey: ["perfil-extras", user?.id, isEmpresa],
    queryFn: async () => {
      if (isEmpresa) {
        const { data, error } = await supabase.from("empresa_dados").select("*").eq("profile_id", user!.id).maybeSingle();
        if (error) throw error;
        return { empresa: data, profissional: null };
      }
      const { data, error } = await supabase.from("profissional_dados").select("*").eq("profile_id", user!.id).maybeSingle();
      if (error) throw error;
      return { empresa: null, profissional: data };
    },
    enabled: !!user && !!userTipo,
  });

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  // profissional
  const [bio, setBio] = useState("");
  const [profissoes, setProfissoes] = useState("");
  const [experiencia, setExperiencia] = useState("");
  const [disponibilidade, setDisponibilidade] = useState("");
  // empresa
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [ramo, setRamo] = useState("");
  const [endereco, setEndereco] = useState("");

  const resetForm = () => {
    setNome(profile?.nome || "");
    setTelefone(profile?.telefone || "");
    const p = extras?.profissional;
    setBio(p?.bio || "");
    setProfissoes((p?.profissoes || []).join(", "));
    setExperiencia(p?.experiencia || "");
    setDisponibilidade(p?.disponibilidade || "");
    const e = extras?.empresa;
    setNomeEmpresa(e?.nome_empresa || "");
    setCnpj(e?.cnpj || "");
    setRamo(e?.ramo || "");
    setEndereco(e?.endereco || "");
  };

  useEffect(resetForm, [profile, extras]);

  const handleSave = async () => {
    if (!user) return;
    if (!nome.trim()) { toast.error("Informe seu nome"); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles")
        .update({ nome: nome.trim(), telefone: telefone.trim() || null })
        .eq("id", user.id);
      if (error) throw error;

      if (isEmpresa) {
        const { error: e } = await supabase.from("empresa_dados").upsert({
          profile_id: user.id,
          nome_empresa: nomeEmpresa.trim() || null,
          cnpj: cnpj.trim() || null,
          ramo: ramo.trim() || null,
          endereco: endereco.trim() || null,
        });
        if (e) throw e;
      } else {
        const { error: e } = await supabase.from("profissional_dados").upsert({
          profile_id: user.id,
          bio: bio.trim() || null,
          profissoes: profissoes.split(",").map((s) => s.trim()).filter(Boolean),
          experiencia: experiencia.trim() || null,
          disponibilidade: disponibilidade.trim() || null,
        });
        if (e) throw e;
      }
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      await queryClient.invalidateQueries({ queryKey: ["perfil-extras"] });
      await queryClient.invalidateQueries({ queryKey: ["empresa-dados"] });
      toast.success("Perfil atualizado!");
      setEditing(false);
    } catch {
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (isLoading || loadingExtras) return <div className="pb-20 pt-12 px-5 text-center text-muted-foreground">Carregando...</div>;

  const media = Number(profile?.avaliacao_media ?? 0);
  const trabalhos = contratacoes.filter((c) => c.status === "finalizada").length;
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })
    : "";
  const nomeExibido = (isEmpresa && extras?.empresa?.nome_empresa) || profile?.nome || "Sem nome";
  const field = "bg-card border-border rounded-xl";

  return (
    <div className="pb-20 pt-12 px-5">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-20 h-20 rounded-2xl gradient-brand flex items-center justify-center text-3xl font-display font-bold text-primary-foreground shadow-brand shrink-0">
          {nomeExibido.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-display font-bold text-foreground truncate">{nomeExibido}</h1>
          <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
          <div className="flex items-center gap-1 mt-1">
            <Stars value={media} />
            <span className="text-sm font-medium text-primary ml-1">{media.toFixed(1)}</span>
          </div>
        </div>
        {editing ? (
          <div className="flex gap-2">
            <button onClick={() => { resetForm(); setEditing(false); }} aria-label="Cancelar"
              className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center shadow-sm">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
            <button onClick={handleSave} aria-label="Salvar"
              className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center shadow-sm">
              {saving ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Save className="h-4 w-4 text-primary" />}
            </button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} aria-label="Editar perfil"
            className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center shadow-sm">
            <Edit2 className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: isEmpresa ? "Contratações" : "Trabalhos", value: trabalhos },
          { label: "Avaliações", value: profile?.total_avaliacoes ?? 0 },
          { label: "Membro desde", value: memberSince },
        ].map((stat) => (
          <div key={stat.label} className="bg-card rounded-xl p-3 text-center border border-border shadow-sm">
            <div className="text-lg font-display font-bold text-primary">{stat.value}</div>
            <div className="text-[10px] text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      {editing ? (
        <div className="space-y-4 mb-6">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">{isEmpresa ? "Nome do responsável" : "Nome"}</label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} className={field} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Telefone / WhatsApp</label>
            <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(16) 99999-0000" className={field} />
          </div>
          {isEmpresa ? (
            <>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Nome da empresa</label>
                <Input value={nomeEmpresa} onChange={(e) => setNomeEmpresa(e.target.value)} className={field} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">CNPJ</label>
                  <Input value={cnpj} onChange={(e) => setCnpj(e.target.value)} className={field} />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Ramo</label>
                  <Input value={ramo} onChange={(e) => setRamo(e.target.value)} placeholder="Ex: Restaurante" className={field} />
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Endereço</label>
                <Input value={endereco} onChange={(e) => setEndereco(e.target.value)} className={field} />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Profissões (separadas por vírgula)</label>
                <Input value={profissoes} onChange={(e) => setProfissoes(e.target.value)} placeholder="Garçom, Auxiliar de Cozinha" className={field} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Disponibilidade</label>
                <Input value={disponibilidade} onChange={(e) => setDisponibilidade(e.target.value)} placeholder="Ex: noites e fins de semana" className={field} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Experiência</label>
                <Textarea value={experiencia} onChange={(e) => setExperiencia(e.target.value)} className={`${field} min-h-[70px]`} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Bio</label>
                <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Conte sobre você..." className={`${field} min-h-[80px]`} />
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {!isEmpresa && extras?.profissional?.profissoes && extras.profissional.profissoes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {extras.profissional.profissoes.map((p) => (
                <span key={p} className="px-3 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary">{p}</span>
              ))}
            </div>
          )}
          {!isEmpresa && extras?.profissional?.bio && (
            <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
              <h3 className="font-display font-bold text-foreground text-sm mb-2">Sobre</h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{extras.profissional.bio}</p>
            </div>
          )}
          {isEmpresa && (extras?.empresa?.ramo || extras?.empresa?.endereco) && (
            <div className="bg-card rounded-xl p-4 border border-border shadow-sm text-sm text-muted-foreground space-y-1">
              {extras.empresa.ramo && <p>Ramo: <span className="text-foreground">{extras.empresa.ramo}</span></p>}
              {extras.empresa.endereco && <p>Endereço: <span className="text-foreground">{extras.empresa.endereco}</span></p>}
            </div>
          )}
          {profile?.telefone && <p className="text-sm text-muted-foreground">Telefone: <span className="text-foreground">{profile.telefone}</span></p>}
        </div>
      )}

      {avaliacoes.length > 0 && (
        <div className="mb-6">
          <h3 className="font-display font-bold text-foreground text-sm mb-3">Avaliações recebidas</h3>
          <div className="space-y-2">
            {avaliacoes.slice(0, 10).map((a) => (
              <div key={a.id} className="bg-card rounded-xl p-3 border border-border">
                <div className="flex items-center justify-between">
                  <Stars value={a.nota} size="sm" />
                  <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString("pt-BR")}</span>
                </div>
                {a.comentario && <p className="text-sm text-muted-foreground mt-1">"{a.comentario}"</p>}
              </div>
            ))}
          </div>
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
