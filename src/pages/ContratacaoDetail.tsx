import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, Calendar, Clock, MapPin, Phone, Info, ChevronRight, MessageCircle } from "lucide-react";
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
import FinalizarContratacaoButton from "@/components/frela/FinalizarContratacaoButton";

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
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState("");

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
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
  const outroId = souEmpresa ? contratacao.profissional_id : contratacao.empresa_id;
  const outro = perfis[outroId];
  const outroNome = souEmpresa ? outro?.nome || "Profissional" : job?.company_name || outro?.nome || "Empresa";
  const minhaAvaliacao = avaliacoes.find((a) => a.de_id === user.id);
  const avaliacaoRecebida = avaliacoes.find((a) => a.para_id === user.id);
  const finalizada = contratacao.status === "finalizada";

  const handleAvaliar = async () => {
    if (nota < 1) { toast.error("Escolha de 1 a 5 estrelas"); return; }
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
        <div className="bg-card rounded-2xl p-4 border border-border shadow-card">
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
            <span className="text-sm text-muted-foreground">Valor combinado</span>
            <span className="text-lg font-display font-bold text-primary">{formatBRL(contratacao.valor)}</span>
          </div>
          {souEmpresa && (
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
              <span>Taxa FreLa (5%)</span>
              <span>{formatBRL(contratacao.taxa_5pct)}</span>
            </div>
          )}
        </div>

        <div className="bg-card rounded-2xl p-4 border border-border shadow-card">
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

        {!finalizada && (
          souEmpresa ? (
            <div className="space-y-2">
              <FinalizarContratacaoButton contratacao={contratacao} className="w-full h-12" />
              <p className="text-xs text-muted-foreground text-center">
                Clique depois que o serviço for realizado. Enquanto isso, não é possível criar novas vagas.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 flex gap-3 text-sm text-blue-900">
              <Info className="h-5 w-5 shrink-0" />
              <p>Você está confirmado(a)! Compareça no dia e horário combinados. Depois do serviço, a empresa confirma a finalização e vocês poderão se avaliar.</p>
            </div>
          )
        )}

        {finalizada && (
          <div className="bg-card rounded-2xl p-4 border border-border shadow-card">
            <h3 className="font-display font-bold text-foreground mb-1">Avaliação</h3>
            {contratacao.finalizada_em && (
              <p className="text-xs text-muted-foreground mb-3">
                Finalizada em {new Date(contratacao.finalizada_em).toLocaleDateString("pt-BR")}
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
                <Stars value={nota} size="lg" onChange={setNota} />
                <Textarea placeholder="Deixe um comentário (opcional)" value={comentario} onChange={(e) => setComentario(e.target.value)}
                  className="rounded-xl bg-background border-border min-h-[80px]" maxLength={500} />
                <Button onClick={handleAvaliar} disabled={avaliar.isPending || nota < 1}
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
