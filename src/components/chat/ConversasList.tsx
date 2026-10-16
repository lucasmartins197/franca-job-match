import { useNavigate } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useConversas } from "@/hooks/useChat";
import { useProfilesByIds } from "@/hooks/useFrela";
import UserAvatar from "@/components/frela/UserAvatar";
import EmptyState from "@/components/frela/EmptyState";
import { cn } from "@/lib/utils";

const horaCurta = (iso: string) => {
  const d = new Date(iso);
  const hoje = new Date();
  if (d.toDateString() === hoje.toDateString()) return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const ontem = new Date(hoje.getTime() - 86_400_000);
  if (d.toDateString() === ontem.toDateString()) return "Ontem";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
};

/** Lista de conversas — uma por contratação. */
const ConversasList = () => {
  const navigate = useNavigate();
  const { user, userTipo } = useAuth();
  const { conversas, isLoading } = useConversas();
  const { data: perfis = {} } = useProfilesByIds(conversas.map((c) => c.outroId));

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-3 p-3"><Skeleton className="h-12 w-12 rounded-xl" />
            <div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-3 w-3/4" /></div></div>
        ))}
      </div>
    );
  }

  if (conversas.length === 0) {
    return (
      <EmptyState icon={MessageCircle} titulo="Nenhuma conversa ainda"
        descricao={userTipo === "empresa"
          ? "Quando você aceitar um candidato, a conversa com ele aparece aqui."
          : "Quando uma empresa confirmar você numa vaga, vocês podem conversar por aqui."} />
    );
  }

  return (
    <ul className="space-y-2">
      {conversas.map(({ contratacao: c, outroId, ultima, naoLidas, atividade }) => {
        const outro = perfis[outroId];
        const souEmpresa = c.empresa_id === user?.id;
        const nome = souEmpresa ? outro?.nome || "Profissional" : c.jobs?.company_name || outro?.nome || "Empresa";
        const preview = ultima
          ? `${ultima.de_id === user?.id ? "Você: " : ""}${ultima.texto}`
          : "Diga olá e combine os detalhes 👋";
        return (
          <li key={c.id}>
            <button onClick={() => navigate(`/chat/${c.id}`)}
              className={cn("w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition-colors",
                naoLidas > 0 ? "bg-primary/5 border-primary/30" : "bg-card border-border hover:border-primary/30")}>
              <UserAvatar nome={nome} fotoUrl={outro?.foto_url} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-foreground truncate">{nome}</p>
                  <span className={cn("text-xs shrink-0", naoLidas > 0 ? "text-primary font-semibold" : "text-muted-foreground")}>{horaCurta(atividade)}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{c.jobs?.title}{c.status === "finalizada" ? " · finalizada" : ""}</p>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <p className={cn("text-sm truncate", naoLidas > 0 ? "text-foreground font-medium" : "text-muted-foreground", !ultima && "italic")}>{preview}</p>
                  {naoLidas > 0 && (
                    <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center shrink-0">{naoLidas}</span>
                  )}
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
};

export default ConversasList;
