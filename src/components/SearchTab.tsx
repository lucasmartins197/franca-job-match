import { useState } from "react";
import { Search, SearchX } from "lucide-react";
import { Input } from "@/components/ui/input";
import JobCard from "@/components/JobCard";
import EmptyState from "@/components/frela/EmptyState";
import { JobListSkeleton } from "@/components/frela/JobCardSkeleton";
import { CATEGORIAS, categoriaDe } from "@/lib/categorias";
import { useJobs } from "@/hooks/useJobs";
import { useProfilesByIds } from "@/hooks/useFrela";
import { cn } from "@/lib/utils";

type Ordem = "data" | "valor";

const SearchTab = () => {
  const [query, setQuery] = useState("");
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [ordem, setOrdem] = useState<Ordem>("data");
  const { data: jobs = [], isLoading } = useJobs();
  const { data: empresas = {} } = useProfilesByIds(jobs.map((j) => j.user_id));

  const filtered = jobs
    .filter((job) => {
      const q = query.trim().toLowerCase();
      const matchQ = !q || [job.title, job.company_name, job.description, job.neighborhood, job.skill].some((t) => t?.toLowerCase().includes(q));
      const matchS = !selectedSkill || categoriaDe(job.category)?.id === selectedSkill;
      return matchQ && matchS;
    })
    .sort((a, b) => (ordem === "valor" ? Number(b.payment) - Number(a.payment) : a.date.localeCompare(b.date)));

  const chip = (ativo: boolean) =>
    cn("shrink-0 px-3.5 h-9 rounded-full text-sm font-medium border transition-colors",
      ativo ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border");

  return (
    <div className="pb-24 pt-10">
      <div className="px-5 mb-4">
        <h1 className="text-2xl font-display font-bold text-foreground mb-4">Buscar vagas</h1>
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Função, empresa, bairro..." value={query} onChange={(e) => setQuery(e.target.value)}
            className="pl-11 h-12 rounded-2xl bg-card shadow-card" />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 pb-1">
          <button onClick={() => setSelectedSkill(null)} className={chip(!selectedSkill)}>Todas</button>
          {CATEGORIAS.map((c) => (
            <button key={c.id} onClick={() => setSelectedSkill(c.id === selectedSkill ? null : c.id)} className={cn(chip(selectedSkill === c.id), "inline-flex items-center gap-1.5")}>
              <c.icon className="h-4 w-4" /> {c.curto}
            </button>
          ))}
        </div>
      </div>
      <div className="px-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-muted-foreground">{isLoading ? "Carregando..." : `${filtered.length} resultado${filtered.length === 1 ? "" : "s"}`}</p>
          <div className="flex bg-muted rounded-lg p-0.5 text-xs font-medium">
            {(["data", "valor"] as Ordem[]).map((o) => (
              <button key={o} onClick={() => setOrdem(o)}
                className={cn("px-2.5 py-1 rounded-md", ordem === o ? "bg-card shadow-card text-foreground" : "text-muted-foreground")}>
                {o === "data" ? "Mais próximas" : "Maior valor"}
              </button>
            ))}
          </div>
        </div>
        {isLoading ? (
          <JobListSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState icon={SearchX} titulo="Nenhuma vaga encontrada" descricao="Tente outra palavra ou outra função." />
        ) : (
          <div className="space-y-3">
            {filtered.map((job, i) => <JobCard key={job.id} job={job} index={i} empresa={empresas[job.user_id]}
 />)}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchTab;
