import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Loader2, Calendar, Clock, MapPin, Phone, Info, ChevronRight, MessageCircle, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import {
  useContratacao, useAvaliacoesDaContratacao, useAvaliar, useProfilesByIds, formatBRL, formatDate,
} from "@/hooks/useFrela";
import PageHeader from "@/components/frela/PageHeader";
import UserAvatar from "@/components/frela/UserAvatar";
import StatusBadge from "@/components/frela/StatusBadge";
import Stars from "@/components/frela/Stars";
import CodigoEmpresaCard from "@/components/confirmacao/CodigoEmpresaCard";
import DigitarCodigoCard from "@/components/confirmacao/DigitarCodigoCard";
import AdminEncerrarCard from "@/components/confirmacao/AdminEncerrarCard";
import { useMeuPerfil } from "@/hooks/usePerfil";
import ConfirmarValorCard from "@/components/taxas/ConfirmarValorCard";
import TaxaStatusBadge from "@/components/taxas/TaxaStatusBadge";
import PageSkeleton from "@/components/frela/PageSkeleton";

const ContratacaoDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: contratacao, isLoading } = useContratacao(id);
  const { data: avaliacoes = [] } = useAvaliacoesDaContratacao(id);
  const { data: perfis = {} } = useProfilesByIds(
    contratacao ? [contratacao.empresa_id, contratacao.profissional_id] : []
  );
  const avaliar = useAvaliar();
  const { data: meuPerfil } = useMeuPerfil();
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState("");
  const { hash } = useLocation();

  // vindo de "Avaliar agora": rola até o cartão de avaliação
  useEffect(() => {
    if (hash === "#avaliacao" && contratacao?.status === "finalizada") {
      setTimeout(() => document.getElementById("avaliacao")?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
    }
  }, [hash, contratacao?.status]);

  if (isLoading) {
    return <PageSkeleton variante="detalhe" />;
  }
  if (!contratacao || !user) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="Contratação" />
        <p className="text-center text-muted-foreground py-16">Contratação não encontrada.</p>
      </div>
    );
  }

  const job = contratacao.jobs;
  const souEmpresa = user.id === contratacao.empresa_id;
  const souParte = souEmpresa || user.id === contratacao.profissional_id;
  // Fase 7: no fluxo com código, a avaliação (com comentário) é obrigatória
  const avaliacaoObrigatoria = !!contratacao.codigo_gerado_em;
  const outroId = souEmpresa ? contratacao.profissional_id : contratacao.empresa_id;
  const outro = perfis[outroId];
  const outroNome = souEmpresa ? outro?.nome || "Profissional" : job?.company_name || outro?.nome || "Empresa";
  const minhaAvaliacao = avaliacoes.find((a) => a.de_id === user.id);
  const avaliacaoRecebida = avaliacoes.find((a) => a.para_id === user.id);
  const finalizada = contratacao.status === "finalizada";

  const handleAvaliar = async () => {
    if (nota < 1) { toast.error("Escolha de 1 a 5 estrelas"); return; }
    if (avaliacaoObrigatoria && comentario.trim().length < 3) { toast.error("Escreva um comentário sobre o serviço"); return; }
    try {
      await avaliar.mutateAsync({ contratacao, nota, comentario });
      toast.success("Avaliação enviada. Obrigado!");
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Erro ao enviar avaliação");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-12 max-w-lg mx-auto">
      <PageHeader title="Contratação" right={<StatusBadge status={contratacao.status} />} />

      <div className="px-5 space-y-4">
        <div className="bg-card rounded-3xl p-4 border border-border/70 shadow-card">
          <button onClick={() => job && navigate(`/job/${job.id}`)} className="text-left w-full">
            <h2 className="text-xl font-display font-bold text-foreground">{job?.title ?? "Vaga"}</h2>
            <p className="text-sm text-muted-foreground">{job?.company_name}</p>
          </button>
          {job && (
            <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              <p className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> {formatDate(job.date)}</p>
              <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> {job.time_start} – {job.time_end}</p>
              <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> {[job.neighborhood, job.address].filter(Boolean).join(" · ") || "Franca/SP"}</p>
            </div>
          )}
          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{finalizada ? "Valor declarado pela empresa" : "Valor combinado"}</span>
            <span className="text-lg font-display font-bold text-primary">{formatBRL(contratacao.valor)}</span>
          </div>
          {finalizada && contratacao.status_taxa === "em_divergencia" && (
            <p className="text-xs text-rose-700 mt-1">
              Profissional informou ter recebido {formatBRL(contratacao.valor_contestado)} — em análise pela equipe FreLa.
            </p>
          )}
          {souEmpresa && (
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground mt-2">
              <button onClick={() => navigate("/taxas")} className="underline decoration-dotted text-left">
                Taxa FreLa (5%){finalizada ? " · ver minhas taxas" : " · entra no saldo quando o código for confirmado"}
              </button>
              <span className="flex items-center gap-2">
                {formatBRL(contratacao.taxa_5pct)}
                {finalizada && <TaxaStatusBadge status={contratacao.status_taxa} />}
              </span>
            </div>
          )}
        </div>

        <div className="bg-card rounded-3xl p-4 border border-border/70 shadow-card">
          <p className="text-xs text-muted-foreground mb-2">{souEmpresa ? "Profissional" : "Empresa"}</p>
          <button onClick={() => navigate(`/perfil/${outroId}`)} className="w-full flex items-center gap-3 text-left">
            <UserAvatar nome={outroNome} fotoUrl={outro?.foto_url} size="md" />
            <div className="min-w-0 flex-1">
              <p className="font-display font-bold text-foreground truncate">{outroNome}</p>
              <div className="flex items-center gap-1.5">
                <Stars value={Number(outro?.avaliacao_media ?? 0)} size="sm" />
                <span className="text-xs text-muted-foreground">
                  {outro?.total_avaliacoes ? `${Number(outro.avaliacao_media).toFixed(1)} (${outro.total_avaliacoes})` : "Sem avaliações"}
                </span>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
          <div className="flex gap-2 mt-4">
            <Button onClick={() => navigate(`/chat/${contratacao.id}`)} className="flex-1 h-11 rounded-xl font-semibold">
              <MessageCircle className="h-4 w-4 mr-2" /> Abrir chat
            </Button>
            {outro?.telefone && (
              <Button asChild variant="outline" className="h-11 rounded-xl">
                <a href={`tel:${outro.telefone}`} aria-label={`Ligar para ${outro.telefone}`}><Phone className="h-4 w-4" /></a>
              </Button>
            )}
          </div>
        </div>

        {!finalizada && souEmpresa && <CodigoEmpresaCard contratacao={contratacao} profissionalNome={outroNome} />}
        {!finalizada && !souEmpresa && souParte && <DigitarCodigoCard contratacao={contratacao} empresaNome={outroNome} />}
        {!finalizada && !souParte && meuPerfil?.profile.is_admin && <AdminEncerrarCard contratacao={contratacao} />}

        {finalizada && !souEmpresa && contratacao.status_taxa === "pendente" && (
          <ConfirmarValorCard contratacao={contratacao} empresaNome={outroNome} />
        )}
        {finalizada && souEmpresa && contratacao.status_taxa === "pendente" && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex gap-3 text-sm text-amber-900">
            <Info className="h-5 w-5 shrink-0" />
            <p>Aguardando {outroNome} confirmar que recebeu {formatBRL(contratacao.valor)}.</p>
          </div>
        )}

        {finalizada && souParte && (
          <div id="avaliacao" className={`bg-card rounded-2xl p-4 border shadow-card ${!minhaAvaliacao && avaliacaoObrigatoria ? "border-2 border-amber-400" : "border-border"}`}>
            <h3 className="font-display font-bold text-foreground mb-1 flex items-center gap-2">
              Avaliação
              {!minhaAvaliacao && avaliacaoObrigatoria && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold"><Star className="h-3 w-3" /> Obrigatória</span>
              )}
            </h3>
            {contratacao.finalizada_em && (
              <p className="text-xs text-muted-foreground mb-3">
                {contratacao.confirmado_por_codigo ? "Confirmada com código em " : "Finalizada em "}
                {new Date(contratacao.finalizada_em).toLocaleDateString("pt-BR")}
              </p>
            )}
            {minhaAvaliacao ? (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Sua avaliação para {outroNome}:</p>
                <Stars value={minhaAvaliacao.nota} />
                {minhaAvaliacao.comentario && <p className="text-sm text-foreground mt-2">"{minhaAvaliacao.comentario}"</p>}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Como foi trabalhar com {outroNome}?</p>
                {avaliacaoObrigatoria && (
                  <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2">
                    {souEmpresa ? "Enquanto não avaliar, você não pode criar vagas nem contratar." : "Enquanto não avaliar, você não pode se candidatar a outras vagas."}
                  </p>
                )}
                <Stars value={nota} size="lg" onChange={setNota} />
                <Textarea placeholder={avaliacaoObrigatoria ? "Conte como foi o serviço (obrigatório)" : "Deixe um comentário (opcional)"} value={comentario} onChange={(e) => setComentario(e.target.value)}
                  className="rounded-xl bg-background border-border min-h-[80px]" maxLength={500} />
                <Button onClick={handleAvaliar} disabled={avaliar.isPending || nota < 1 || (avaliacaoObrigatoria && comentario.trim().length < 3)}
                  className="w-full h-12 rounded-xl text-primary-foreground font-semibold">
                  {avaliar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar avaliação"}
                </Button>
              </div>
            )}
            {avaliacaoRecebida && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-1">{outroNome} avaliou você:</p>
                <Stars value={avaliacaoRecebida.nota} />
                {avaliacaoRecebida.comentario && <p className="text-sm text-foreground mt-2">"{avaliacaoRecebida.comentario}"</p>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContratacaoDetail;
