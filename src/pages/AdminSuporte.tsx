import { useNavigate } from "react-router-dom";
import { Headset, ShieldAlert } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfilesByIds } from "@/hooks/useFrela";
import { useIsAdmin, useSuporteAtendimentos } from "@/hooks/useSuporte";
import PageHeader from "@/components/frela/PageHeader";
import UserAvatar from "@/components/frela/UserAvatar";
import EmptyState from "@/components/frela/EmptyState";
import { cn } from "@/lib/utils";

/** Painel do ADM: todas as conversas de suporte, não lidas primeiro. */
const AdminSuporte = () => {
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();
  const { conversas, isLoading } = useSuporteAtendimentos(isAdmin);
  const { data: perfis = {} } = useProfilesByIds(conversas.map((c) => c.userId));

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background max-w-lg mx-auto">
        <PageHeader title="Atendimento" />
        <EmptyState icon={ShieldAlert} titulo="Área restrita à equipe FreLa" />
      </div>
    );
  }

  const ordenadas = [...conversas].sort((a, b) => (b.naoLidas > 0 ? 1 : 0) - (a.naoLidas > 0 ? 1 : 0) || b.ultima.created_at.localeCompare(a.ultima.created_at));

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto pb-12">
      <PageHeader title="Atendimento (suporte)" />
      <div className="px-5">
        {isLoading ? (
          <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
        ) : ordenadas.length === 0 ? (
          <EmptyState icon={Headset} titulo="Nenhum chamado ainda" descricao="Quando alguém escrever para o suporte, a conversa aparece aqui." />
        ) : (
          <ul className="space-y-2">
            {ordenadas.map((c) => {
              const p = perfis[c.userId];
              return (
                <li key={c.userId}>
                  <button onClick={() => navigate(`/admin/suporte/${c.userId}`)}
                    className={cn("w-full flex items-center gap-3 p-3 rounded-2xl border text-left",
                      c.naoLidas > 0 ? "bg-primary/5 border-primary/30" : "bg-card border-border")}>
                    <UserAvatar nome={p?.nome} fotoUrl={p?.foto_url} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-foreground truncate">{p?.nome || "Usuário"}</p>
                        <span className="text-xs text-muted-foreground shrink-0">{new Date(c.ultima.created_at).toLocaleDateString("pt-BR")}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{p?.tipo === "empresa" ? "Empresa" : "Profissional"}</p>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-muted-foreground truncate">{c.ultima.autor_id !== c.userId ? "Equipe: " : ""}{c.ultima.texto}</p>
                        {c.naoLidas > 0 && (
                          <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center">{c.naoLidas}</span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AdminSuporte;
