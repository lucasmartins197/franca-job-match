import { useState } from "react";
import { Search, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import JobCard from "@/components/JobCard";
import CategoryGrid from "@/components/CategoryGrid";
import { JobCategory } from "@/types";
import { useJobs, DbJob } from "@/hooks/useJobs";
import { useAuth } from "@/hooks/useAuth";
import { mockJobs } from "@/data/mockData";
import { Job } from "@/types";

const dbJobToJob = (j: DbJob): Job => ({
  id: j.id, companyId: j.user_id, companyName: j.company_name, title: j.title,
  category: j.category as JobCategory, skill: j.skill as any, description: j.description,
  date: j.date, timeStart: j.time_start, timeEnd: j.time_end, payment: j.payment,
  slots: j.slots, slotsRemaining: j.slots_remaining, neighborhood: j.neighborhood,
  address: j.address, status: j.status as any, postedAt: j.created_at,
});

const HomeTab = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<JobCategory | null>(null);
  const { user } = useAuth();
  const { data: dbJobs } = useJobs();

  const nome = user?.user_metadata?.nome || "Usuário";
  const allJobs = dbJobs && dbJobs.length > 0 ? dbJobs.map(dbJobToJob) : mockJobs;

  const filteredJobs = allJobs.filter((job) => {
    const matchesSearch = !searchQuery ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.companyName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || job.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="px-5 pt-12 pb-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-muted-foreground text-sm">📍 Franca, SP</p>
            <h1 className="text-2xl font-display font-bold text-foreground">
              Olá, {nome.split(" ")[0]} 👋
            </h1>
          </div>
          <button className="relative w-10 h-10 bg-card border border-border rounded-xl flex items-center justify-center">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-gold rounded-full" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar vagas, categorias..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-12 rounded-xl bg-card border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="px-5 space-y-6">
        {/* Categories */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-foreground">Categorias</h2>
            {selectedCategory && (
              <button onClick={() => setSelectedCategory(null)} className="text-xs text-gold font-medium">
                Limpar
              </button>
            )}
          </div>
          <CategoryGrid onSelect={setSelectedCategory} selected={selectedCategory} />
        </div>

        {/* Recent Jobs */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-foreground">
              Vagas Recentes
              {selectedCategory && <span className="text-sm font-normal text-muted-foreground ml-2">em {selectedCategory}</span>}
            </h2>
            <span className="text-xs text-muted-foreground">{filteredJobs.length} vagas</span>
          </div>
          {filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhuma vaga encontrada</p>
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
