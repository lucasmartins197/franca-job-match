import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import JobCard from "@/components/JobCard";
import CategoryGrid from "@/components/CategoryGrid";
import NotificationBell from "@/components/frela/NotificationBell";
import { JobCategory } from "@/types";
import { useJobs } from "@/hooks/useJobs";
import { useAuth } from "@/hooks/useAuth";
import { useMyProfile } from "@/hooks/useFrela";

const HomeTab = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<JobCategory | null>(null);
  const { user } = useAuth();
  const { data: profile } = useMyProfile();
  const { data: jobs = [], isLoading } = useJobs();

  const nome = profile?.nome || user?.user_metadata?.nome || "Usuário";
  const cidade = profile?.cidade || "Franca";

  const filteredJobs = jobs.filter((job) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || job.title.toLowerCase().includes(q) || job.company_name.toLowerCase().includes(q);
    const matchesCategory = !selectedCategory || job.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="pb-20">
      <div className="px-5 pt-12 pb-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-muted-foreground text-sm">📍 {cidade}, SP</p>
            <h1 className="text-2xl font-display font-bold text-foreground">
              Olá, {nome.split(" ")[0]} 👋
            </h1>
          </div>
          <NotificationBell />
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar vagas, empresas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-12 rounded-xl bg-card border-border text-foreground placeholder:text-muted-foreground shadow-sm"
          />
        </div>
      </div>

      <div className="px-5 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-foreground">Categorias</h2>
            {selectedCategory && (
              <button onClick={() => setSelectedCategory(null)} className="text-xs text-primary font-medium">
                Limpar
              </button>
            )}
          </div>
          <CategoryGrid onSelect={setSelectedCategory} selected={selectedCategory} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-foreground">
              Vagas abertas
              {selectedCategory && <span className="text-sm font-normal text-muted-foreground ml-2">em {selectedCategory}</span>}
            </h2>
            <span className="text-xs text-muted-foreground">{filteredJobs.length} vagas</span>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhuma vaga aberta no momento</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Volte mais tarde — novas vagas aparecem aqui.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredJobs.map((job, i) => (
                <JobCard key={job.id} job={job} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeTab;
