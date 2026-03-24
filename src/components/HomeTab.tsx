import { useState } from "react";
import { Search, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import JobCard from "@/components/JobCard";
import CategoryGrid from "@/components/CategoryGrid";
import { CATEGORIES } from "@/data/mockData";
import { JobCategory } from "@/types";
import JobDetailSheet from "@/components/JobDetailSheet";
import { useJobs, DbJob } from "@/hooks/useJobs";
import { mockJobs } from "@/data/mockData";
import { Job } from "@/types";

const dbJobToJob = (j: DbJob): Job => ({
  id: j.id,
  companyId: j.user_id,
  companyName: j.company_name,
  title: j.title,
  category: j.category as JobCategory,
  skill: j.skill as any,
  description: j.description,
  date: j.date,
  timeStart: j.time_start,
  timeEnd: j.time_end,
  payment: j.payment,
  slots: j.slots,
  slotsRemaining: j.slots_remaining,
  neighborhood: j.neighborhood,
  address: j.address,
  status: j.status as any,
  postedAt: j.created_at,
});

const HomeTab = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<JobCategory | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const { data: dbJobs } = useJobs();

  const allJobs = dbJobs && dbJobs.length > 0 ? dbJobs.map(dbJobToJob) : mockJobs;

  const filteredJobs = allJobs.filter((job) => {
    const matchesSearch =
      !searchQuery ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.skill.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || job.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="pb-20">
      <div className="bg-gradient-hero px-5 pt-12 pb-8 rounded-b-3xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-primary-foreground/70 text-sm font-medium">📍 Franca, SP</p>
            <h1 className="text-2xl font-extrabold text-primary-foreground">Olá! 👋</h1>
          </div>
          <button className="relative w-10 h-10 bg-primary-foreground/15 rounded-xl flex items-center justify-center">
            <Bell className="h-5 w-5 text-primary-foreground" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full border-2 border-primary" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar vagas, habilidades..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-12 rounded-xl bg-card border-0 shadow-md text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="px-5 mt-6 space-y-6">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Vagas Abertas", value: String(allJobs.length), emoji: "🔥" },
            { label: "Freelancers", value: "2.3k", emoji: "👥" },
            { label: "Empresas", value: "10k+", emoji: "🏢" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card rounded-2xl p-3 text-center border border-border/50 shadow-card">
              <div className="text-xl mb-1">{stat.emoji}</div>
              <div className="text-lg font-extrabold text-foreground">{stat.value}</div>
              <div className="text-[10px] text-muted-foreground font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-foreground">Categorias</h2>
            {selectedCategory && (
              <button onClick={() => setSelectedCategory(null)} className="text-xs text-primary font-semibold">Limpar filtro</button>
            )}
          </div>
          <CategoryGrid onSelect={setSelectedCategory} selected={selectedCategory} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-foreground">
              Vagas Recentes
              {selectedCategory && <span className="text-sm font-normal text-muted-foreground ml-2">em {selectedCategory}</span>}
            </h2>
            <span className="text-xs text-muted-foreground">{filteredJobs.length} vagas</span>
          </div>
          {filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-muted-foreground font-medium">Nenhuma vaga encontrada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredJobs.map((job, i) => (
                <JobCard key={job.id} job={job} index={i} onClick={() => setSelectedJob(job)} />
              ))}
            </div>
          )}
        </div>
      </div>

      <JobDetailSheet job={selectedJob} onClose={() => setSelectedJob(null)} />
    </div>
  );
};

export default HomeTab;
