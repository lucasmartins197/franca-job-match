import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Trophy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecomendadosProfissionais } from "@/hooks/useRecomendacoes";
import PageHeader from "@/components/frela/PageHeader";
import EmptyState from "@/components/frela/EmptyState";
import ProfissionalCard from "@/components/perfil/ProfissionalCard";
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
          <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-40 rounded-3xl" />)}</div>
        ) : filtrados.length === 0 ? (
          <EmptyState icon={Trophy} titulo="Ninguém por aqui ainda" descricao="Assim que os profissionais completarem trabalhos e receberem avaliações, eles aparecem aqui." />
        ) : (
          <ol className="space-y-3">
            {filtrados.map((p, i) => (
              <li key={p.id}><ProfissionalCard p={p} posicao={i + 1} index={i} /></li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
};

export default Recomendados;
