import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, ChevronRight, MapPin, Search, Star, Trophy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { selosRecomendado, useRecomendadosProfissionais } from "@/hooks/useRecomendacoes";
import PageHeader from "@/components/frela/PageHeader";
import UserAvatar from "@/components/frela/UserAvatar";
import EmptyState from "@/components/frela/EmptyState";
import Selos from "@/components/perfil/Selos";
import { cn } from "@/lib/utils";

/** Vitrine para a empresa: os melhores profissionais, ordenados por selo > avaliação > trabalhos. */
const Recomendados = () => {
  const navigate = useNavigate();
  const { data: lista = [], isLoading } = useRecomendadosProfissionais(100);
  const [q, setQ] = useState("");
  const [profissao, setProfissao] = useState<string | null>(null);

  const profissoes = useMemo(() => {
    const cont = new Map<string, number>();
    lista.forEach((p) => (p.profissoes ?? []).forEach((x) => cont.set(x, (cont.get(x) ?? 0) + 1)));
    return [...cont.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([x]) => x);
  }, [lista]);

  const filtrados = lista.filter((p) => {
    const t = q.trim().toLowerCase();
    return (!profissao || (p.profissoes ?? []).includes(profissao)) &&
      (!t || `${p.nome ?? ""} ${(p.profissoes ?? []).join(" ")}`.toLowerCase().includes(t));
  });

  return (
    <div className="min-h-screen bg-background max-w-2xl mx-auto pb-12">
      <PageHeader title="Melhores profissionais" />
      <div className="px-5 space-y-4">
        <div className="rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-white p-4 flex gap-3 items-center">
          <Trophy className="h-8 w-8 shrink-0" />
          <p className="text-sm">
            <b className="block text-base">A vitrine dos melhores de Franca</b>
            Profissionais com selo Indicado e Verificado aparecem primeiro, depois os mais bem avaliados e com mais trabalhos.
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome ou profissão" className="pl-11 h-12 rounded-2xl bg-card" />
        </div>
        {profissoes.length > 0 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5">
            {[null, ...profissoes].map((p) => (
              <button key={p ?? "todas"} onClick={() => setProfissao(p)}
                className={cn("shrink-0 h-9 px-3.5 rounded-full text-sm font-medium border",
                  profissao === p ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border")}>
                {p ?? "Todas"}
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
        ) : filtrados.length === 0 ? (
          <EmptyState icon={Trophy} titulo="Ninguém por aqui ainda" descricao="Assim que os profissionais completarem trabalhos e receberem avaliações, eles aparecem aqui." />
        ) : (
          <ol className="space-y-3">
            {filtrados.map((p, i) => (
              <li key={p.id}>
                <button onClick={() => navigate(`/perfil/${p.id}`)}
                  className={cn("w-full text-left bg-card rounded-2xl border p-4 shadow-card flex gap-3 items-start hover:border-primary/40",
                    p.indicado ? "border-amber-300" : "border-border")}>
                  <div className="relative shrink-0">
                    <UserAvatar nome={p.nome} fotoUrl={p.foto_url} size="lg" />
                    <span className={cn("absolute -top-2 -left-2 w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center border-2 border-card",
                      i === 0 ? "bg-amber-400 text-amber-950" : i === 1 ? "bg-slate-300 text-slate-800" : i === 2 ? "bg-orange-300 text-orange-900" : "bg-muted text-muted-foreground")}>
                      {i + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold text-foreground truncate">{p.nome}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {p.total_avaliacoes ? <><b className="text-foreground">{Number(p.avaliacao_media).toFixed(1)}</b> ({p.total_avaliacoes})</> : "Sem avaliações"}
                      </span>
                      <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {p.trabalhos} trabalho{p.trabalhos === 1 ? "" : "s"}</span>
                      {p.cidade && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {p.cidade}</span>}
                    </div>
                    <Selos selos={selosRecomendado(p)} size="sm" className="mt-1.5" />
                    {(p.profissoes ?? []).length > 0 && (
                      <p className="text-xs text-foreground/80 mt-1.5 truncate">{(p.profissoes ?? []).join(" · ")}</p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 self-center" />
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
};

export default Recomendados;
