import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import {
  DIAS, PERIODOS, PerfilCompleto, camposFaltando, formatDisponibilidade, geocodificar, normalizarInstagram,
  normalizarLinkedin, parseDisponibilidade, useInvalidatePerfil,
} from "@/hooks/usePerfil";
import { TODAS_FUNCOES } from "@/lib/categorias";
import PortfolioEditor from "@/components/perfil/PortfolioEditor";
import PhotoUpload from "@/components/frela/PhotoUpload";
import ChipSelect from "@/components/frela/ChipSelect";

const RAMOS = ["Bar / Restaurante", "Comércio / Loja", "Eventos", "Beleza e Estética", "Indústria", "Logística", "Construção", "Serviços", "Outro"];

interface Props {
  perfil: PerfilCompleto;
  submitLabel?: string;
  onSaved?: () => void;
}

const Campo = ({ id, label, obrigatorio, children, dica }: { id?: string; label: string; obrigatorio?: boolean; children: React.ReactNode; dica?: string }) => (
  <div className="space-y-1.5">
    <Label htmlFor={id}>
      {label} {obrigatorio && <span className="text-primary">*</span>}
    </Label>
    {children}
    {dica && <p className="text-xs text-muted-foreground">{dica}</p>}
  </div>
);

const Secao = ({ titulo, children }: { titulo: string; children: React.ReactNode }) => (
  <section className="bg-card border border-border rounded-2xl p-4 space-y-4">
    <h2 className="font-display font-bold text-foreground">{titulo}</h2>
    {children}
  </section>
);

/** Formulário de perfil (profissional ou empresa). Usado em "completar perfil" e "editar perfil". */
const ProfileForm = ({ perfil, submitLabel = "Salvar perfil", onSaved }: Props) => {
  const { user } = useAuth();
  const invalidate = useInvalidatePerfil();
  const isEmpresa = perfil.profile.tipo === "empresa";
  const [saving, setSaving] = useState(false);

  const [foto, setFoto] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cidade, setCidade] = useState("");
  // profissional
  const [profissoes, setProfissoes] = useState<string[]>([]);
  const [experiencia, setExperiencia] = useState("");
  const [bio, setBio] = useState("");
  const [dias, setDias] = useState<string[]>([]);
  const [periodos, setPeriodos] = useState<string[]>([]);
  const [obsDisp, setObsDisp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [linkedin, setLinkedin] = useState("");
  // empresa
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [ramo, setRamo] = useState<string[]>([]);
  const [endereco, setEndereco] = useState("");
  const [bioEmpresa, setBioEmpresa] = useState("");

  useEffect(() => {
    const { profile, profissional: d, empresa: e } = perfil;
    setFoto(profile.foto_url);
    setNome(profile.nome ?? "");
    setTelefone(profile.telefone ?? "");
    setCidade(profile.cidade || "Franca");
    setProfissoes(d?.profissoes ?? []);
    setExperiencia(d?.experiencia ?? "");
    setBio(d?.bio ?? "");
    const disp = parseDisponibilidade(d?.disponibilidade);
    setDias(disp.dias);
    setPeriodos(disp.periodos);
    setObsDisp(disp.obs);
    setInstagram(d?.instagram ?? "");
    setLinkedin(d?.linkedin ?? "");
    setNomeEmpresa(e?.nome_empresa ?? "");
    setCnpj(e?.cnpj ?? "");
    setRamo(e?.ramo ? [e.ramo] : []);
    setEndereco(e?.endereco ?? "");
    setBioEmpresa(e?.bio ?? "");
  }, [perfil]);

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!user) return;

    const disponibilidade = formatDisponibilidade(dias, periodos, obsDisp);
    const rascunho: PerfilCompleto = {
      profile: { ...perfil.profile, foto_url: foto, nome: nome.trim(), telefone: telefone.trim(), cidade: cidade.trim() },
      empresa: isEmpresa
        ? {
            profile_id: user.id,
            nome_empresa: nomeEmpresa.trim(),
            cnpj: cnpj.trim() || null,
            ramo: ramo[0] ?? null,
            endereco: endereco.trim(),
            bio: bioEmpresa.trim() || null,
            latitude: perfil.empresa?.latitude ?? null,
            longitude: perfil.empresa?.longitude ?? null,
          }
        : null,
      profissional: isEmpresa
        ? null
        : {
            profile_id: user.id,
            profissoes,
            experiencia: experiencia.trim(),
            bio: bio.trim(),
            disponibilidade,
            instagram: instagram.trim() ? normalizarInstagram(instagram) : null,
            linkedin: linkedin.trim() ? normalizarLinkedin(linkedin) : null,
          },
    };

    const faltando = camposFaltando(rascunho);
    if (faltando.length > 0) {
      toast.error(`Falta preencher: ${faltando.join(", ")}`);
      return;
    }

    setSaving(true);
    try {
      // Mapa: geocodifica o endereço da empresa quando ele muda (OpenStreetMap, sem chave)
      if (rascunho.empresa) {
        const mudou = rascunho.empresa.endereco !== perfil.empresa?.endereco || rascunho.profile.cidade !== perfil.profile.cidade;
        if (mudou || rascunho.empresa.latitude == null) {
          const coords = await geocodificar(rascunho.empresa.endereco ?? "", rascunho.profile.cidade ?? "Franca");
          rascunho.empresa.latitude = coords?.lat ?? null;
          rascunho.empresa.longitude = coords?.lon ?? null;
        }
      }

      const { error } = await supabase
        .from("profiles")
        .update({ foto_url: foto, nome: rascunho.profile.nome, telefone: rascunho.profile.telefone, cidade: rascunho.profile.cidade })
        .eq("id", user.id);
      if (error) throw error;

      const { error: e2 } = isEmpresa
        ? await supabase.from("empresa_dados").upsert(rascunho.empresa!)
        : await supabase.from("profissional_dados").upsert(rascunho.profissional!);
      if (e2) {
        if (e2.message.includes("instagram") || e2.message.includes("linkedin")) {
          throw new Error("Banco desatualizado: rode o SQL da Fase 2 (colunas instagram/linkedin).");
        }
        if (e2.message.includes("bio") || e2.message.includes("latitude")) {
          throw new Error("Banco desatualizado: rode o SQL da Fase 3.");
        }
        throw e2;
      }

      await invalidate();
      toast.success("Perfil salvo!");
      onSaved?.();
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Erro ao salvar o perfil");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {user && <PhotoUpload userId={user.id} nome={isEmpresa ? nomeEmpresa || nome : nome} value={foto} onChange={setFoto} obrigatoria />}

      {isEmpresa ? (
        <Secao titulo="Sua empresa">
          <Campo id="nome-empresa" label="Nome da empresa" obrigatorio>
            <Input id="nome-empresa" value={nomeEmpresa} onChange={(e) => setNomeEmpresa(e.target.value)} className="h-11 rounded-xl" />
          </Campo>
          <Campo label="Ramo" obrigatorio>
            <ChipSelect options={RAMOS} value={ramo} onChange={(v) => setRamo(v.slice(-1))} />
          </Campo>
          <Campo id="endereco" label="Endereço" obrigatorio>
            <Input id="endereco" placeholder="Rua, número - bairro" value={endereco} onChange={(e) => setEndereco(e.target.value)} className="h-11 rounded-xl" />
          </Campo>
          <Campo id="bio-empresa" label="Sobre a empresa" dica="O que vocês fazem, ambiente de trabalho, o que valorizam.">
            <Textarea id="bio-empresa" value={bioEmpresa} onChange={(e) => setBioEmpresa(e.target.value)} maxLength={600}
              placeholder="Ex: Bar com música ao vivo no Centro há 10 anos. Equipe animada e pagamento no mesmo dia." className="rounded-xl min-h-[80px]" />
          </Campo>
          <Campo id="cnpj" label="CNPJ" dica="Opcional, mas passa mais confiança aos profissionais.">
            <Input id="cnpj" inputMode="numeric" placeholder="00.000.000/0000-00" value={cnpj} onChange={(e) => setCnpj(e.target.value)} className="h-11 rounded-xl" />
          </Campo>
        </Secao>
      ) : null}

      <Secao titulo={isEmpresa ? "Responsável e contato" : "Dados pessoais"}>
        <Campo id="nome" label={isEmpresa ? "Nome do responsável" : "Nome completo"} obrigatorio>
          <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} className="h-11 rounded-xl" />
        </Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo id="telefone" label="Telefone / WhatsApp" obrigatorio>
            <Input id="telefone" type="tel" placeholder="(16) 99999-0000" value={telefone} onChange={(e) => setTelefone(e.target.value)} className="h-11 rounded-xl" />
          </Campo>
          <Campo id="cidade" label="Cidade" obrigatorio>
            <Input id="cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} className="h-11 rounded-xl" />
          </Campo>
        </div>
        {!isEmpresa && (
          <p className="text-xs text-muted-foreground">Seu telefone só aparece para a empresa depois que ela confirmar você numa vaga.</p>
        )}
      </Secao>

      {!isEmpresa && (
        <>
          <Secao titulo="O que você faz">
            <Campo label="Profissões" obrigatorio dica="Escolha todas que você faz.">
              <ChipSelect options={TODAS_FUNCOES} value={profissoes} onChange={setProfissoes} allowCustom limite={14} />
            </Campo>
            <Campo id="experiencia" label="Experiência" obrigatorio dica="Onde já trabalhou e por quanto tempo.">
              <Textarea id="experiencia" placeholder="Ex: 2 anos como garçom no Restaurante X; eventos de formatura..." value={experiencia}
                onChange={(e) => setExperiencia(e.target.value)} className="rounded-xl min-h-[90px]" maxLength={1000} />
            </Campo>
            <Campo id="bio" label="Sobre você" obrigatorio>
              <Textarea id="bio" placeholder="Conte um pouco sobre você, seu jeito de trabalhar..." value={bio}
                onChange={(e) => setBio(e.target.value)} className="rounded-xl min-h-[80px]" maxLength={600} />
            </Campo>
          </Secao>

          <Secao titulo="Disponibilidade">
            <Campo label="Dias" obrigatorio>
              <ChipSelect options={DIAS} value={dias} onChange={(v) => setDias(DIAS.filter((d) => v.includes(d)))} />
            </Campo>
            <Campo label="Períodos">
              <ChipSelect options={PERIODOS} value={periodos} onChange={(v) => setPeriodos(PERIODOS.filter((p) => v.includes(p)))} />
            </Campo>
            <Campo id="obs-disp" label="Observação">
              <Input id="obs-disp" placeholder="Ex: só depois das 18h durante a semana" value={obsDisp} onChange={(e) => setObsDisp(e.target.value)} className="h-11 rounded-xl" />
            </Campo>
          </Secao>

          {user && (
            <Secao titulo="Portfólio (opcional)">
              <p className="text-xs text-muted-foreground -mt-2">Fotos de trabalhos que você já fez: eventos, pratos, unhas, obras... Perfis com fotos recebem mais convites.</p>
              <PortfolioEditor userId={user.id} />
            </Secao>
          )}

          <Secao titulo="Redes sociais (opcional)">
            <Campo id="instagram" label="Instagram">
              <Input id="instagram" placeholder="@seuperfil" value={instagram} onChange={(e) => setInstagram(e.target.value)} className="h-11 rounded-xl" autoCapitalize="none" />
            </Campo>
            <Campo id="linkedin" label="LinkedIn">
              <Input id="linkedin" placeholder="linkedin.com/in/seuperfil" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} className="h-11 rounded-xl" autoCapitalize="none" />
            </Campo>
          </Secao>
        </>
      )}

      <Button type="submit" disabled={saving} className="w-full h-12 rounded-xl font-semibold text-base">
        {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : submitLabel}
      </Button>
    </form>
  );
};

export default ProfileForm;
