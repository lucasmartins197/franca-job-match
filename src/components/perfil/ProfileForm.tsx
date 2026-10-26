import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";

const RAMOS = ["Bar / Restaurante", "Comércio / Loja", "Eventos", "Beleza e Estética", "Indústria", "Logística", "Construção", "Serviços", "Outro"];

interface Props {
  perfil: PerfilCompleto;
  submitLabel?: string;
  onSaved?: () => void;
  /** Onboarding: mostra uma etapa por vez (Continuar / Voltar) e salva no fim. */
  passoAPasso?: boolean;
}

type SecaoId = "foto" | "empresa" | "pessoal" | "oquefaz" | "disp" | "portfolio" | "redes";

interface Passo {
  titulo: string;
  descricao: string;
  secoes: SecaoId[];
  /** nomes de camposFaltando() validados ao avançar */
  campos: string[];
}

const PASSOS_PROFISSIONAL: Passo[] = [
  { titulo: "Foto e contato", descricao: "Uma foto de rosto, nítida, passa confiança para a empresa.", secoes: ["foto", "pessoal"], campos: ["foto", "nome", "telefone", "cidade"] },
  { titulo: "O que você faz", descricao: "Escolha suas profissões e conte sua experiência — é o seu currículo.", secoes: ["oquefaz"], campos: ["profissões", "experiência", "sobre você"] },
  { titulo: "Quando você pode trabalhar", descricao: "Avisamos você quando abrir vaga da sua profissão nesses dias.", secoes: ["disp"], campos: ["dias disponíveis"] },
  { titulo: "Portfólio e redes", descricao: "Opcional, mas perfis com fotos de trabalhos recebem mais convites.", secoes: ["portfolio", "redes"], campos: [] },
];

const PASSOS_EMPRESA: Passo[] = [
  { titulo: "Sua empresa", descricao: "Os profissionais veem isso antes de se candidatar.", secoes: ["foto", "empresa"], campos: ["foto", "nome da empresa", "ramo", "endereço"] },
  { titulo: "Responsável e contato", descricao: "Quem fala com o profissional no dia do serviço.", secoes: ["pessoal"], campos: ["nome", "telefone", "cidade"] },
];

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
const ProfileForm = ({ perfil, submitLabel = "Salvar perfil", onSaved, passoAPasso = false }: Props) => {
  const { user } = useAuth();
  const invalidate = useInvalidatePerfil();
  const isEmpresa = perfil.profile.tipo === "empresa";
  const [saving, setSaving] = useState(false);
  const [passo, setPasso] = useState(0);
  const passos = isEmpresa ? PASSOS_EMPRESA : PASSOS_PROFISSIONAL;
  const ultimoPasso = !passoAPasso || passo === passos.length - 1;
  const mostra = (id: SecaoId) => !passoAPasso || passos[passo].secoes.includes(id);

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

  const montarRascunho = (): PerfilCompleto | null => {
    if (!user) return null;
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
    return rascunho;
  };

  const avancar = () => {
    const rascunho = montarRascunho();
    if (!rascunho) return;
    const faltando = camposFaltando(rascunho).filter((c) => passos[passo].campos.includes(c));
    if (faltando.length > 0) {
      toast.error(`Falta preencher: ${faltando.join(", ")}`);
      return;
    }
    setPasso((p) => p + 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!user) return;
    if (!ultimoPasso) return avancar();
    const rascunho = montarRascunho();
    if (!rascunho) return;

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
      {passoAPasso && (
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>Passo {passo + 1} de {passos.length}</span>
            <span>{Math.round(((passo + 1) / passos.length) * 100)}%</span>
          </div>
          <Progress value={((passo + 1) / passos.length) * 100} className="h-2" />
          <h2 className="text-lg font-display font-bold text-foreground mt-4">{passos[passo].titulo}</h2>
          <p className="text-sm text-muted-foreground">{passos[passo].descricao}</p>
        </div>
      )}

      {mostra("foto") && user && <PhotoUpload userId={user.id} nome={isEmpresa ? nomeEmpresa || nome : nome} value={foto} onChange={setFoto} obrigatoria />}

      {isEmpresa && mostra("empresa") ? (
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

      {mostra("pessoal") && <Secao titulo={isEmpresa ? "Responsável e contato" : "Dados pessoais"}>
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
      </Secao>}

      {!isEmpresa && (
        <>
          {mostra("oquefaz") && <Secao titulo="O que você faz">
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
          </Secao>}

          {mostra("disp") && <Secao titulo="Disponibilidade">
            <Campo label="Dias em que você pode trabalhar" obrigatorio dica="Você recebe aviso das vagas da sua profissão nesses dias.">
              <ChipSelect options={DIAS} value={dias} onChange={(v) => setDias(DIAS.filter((d) => v.includes(d)))} />
            </Campo>
            <Campo label="Períodos" dica="Se marcar, só avisamos de vagas que começam nesses períodos.">
              <ChipSelect options={PERIODOS} value={periodos} onChange={(v) => setPeriodos(PERIODOS.filter((p) => v.includes(p)))} />
            </Campo>
            <Campo id="obs-disp" label="Observação">
              <Input id="obs-disp" placeholder="Ex: só depois das 18h durante a semana" value={obsDisp} onChange={(e) => setObsDisp(e.target.value)} className="h-11 rounded-xl" />
            </Campo>
          </Secao>}

          {mostra("portfolio") && user && (
            <Secao titulo="Portfólio (opcional)">
              <p className="text-xs text-muted-foreground -mt-2">Fotos de trabalhos que você já fez: eventos, pratos, unhas, obras... Perfis com fotos recebem mais convites.</p>
              <PortfolioEditor userId={user.id} />
            </Secao>
          )}

          {mostra("redes") && <Secao titulo="Redes sociais (opcional)">
            <Campo id="instagram" label="Instagram">
              <Input id="instagram" placeholder="@seuperfil" value={instagram} onChange={(e) => setInstagram(e.target.value)} className="h-11 rounded-xl" autoCapitalize="none" />
            </Campo>
            <Campo id="linkedin" label="LinkedIn">
              <Input id="linkedin" placeholder="linkedin.com/in/seuperfil" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} className="h-11 rounded-xl" autoCapitalize="none" />
            </Campo>
          </Secao>}
        </>
      )}

      <div className="flex gap-2">
        {passoAPasso && passo > 0 && (
          <Button type="button" variant="outline" onClick={() => { setPasso((p) => p - 1); window.scrollTo(0, 0); }} className="h-12 rounded-xl" aria-label="Voltar">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <Button type="submit" disabled={saving} className="flex-1 h-12 rounded-xl font-semibold text-base">
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : ultimoPasso ? submitLabel : "Continuar"}
        </Button>
      </div>
    </form>
  );
};

export default ProfileForm;
