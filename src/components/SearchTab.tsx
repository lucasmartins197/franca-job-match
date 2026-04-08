import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import JobCard from "@/components/JobCard";
import { mockJobs, SKILLS } from "@/data/mockData";
import { Job, Skill, JobCategory } from "@/types";
import { useJobs, DbJob } from "@/hooks/useJobs";

const dbJobToJob = (j: DbJob): Job => ({
  id: j.id, companyId: j.user_id, companyName: j.company_name, title: j.title,
  category: j.category as JobCategory, skill: j.skill as any, description: j.description,
  date: j.date, timeStart: j.time_start, timeEnd: j.time_end, payment: j.payment,
  slots: j.slots, slotsRemaining: j.slots_remaining, neighborhood: j.neighborhood,
  address: j.address, status: j.status as any, postedAt: j.created_at,
});

const SearchTab = () => {
  const [query, setQuery] = useState("");
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const { data: dbJobs } = useJobs();

  const allJobs = dbJobs && dbJobs.length > 0 ? dbJobs.map(dbJobToJob) : mockJobs;

  const filtered = allJobs.filter((job) => {
    const matchQ = !query || job.title.toLowerCase().includes(query.toLowerCase()) || job.companyName.toLowerCase().includes(query.toLowerCase());
    const matchS = !selectedSkill || job.skill === selectedSkill;
    return matchQ && matchS;
  });

  return (
    <div className="pb-20 pt-12">
      <div className="px-5 mb-4">
        <h1 className="text-2xl font-display font-bold text-foreground mb-4">Buscar Vagas</h1>
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cargo, empresa ou habilidade..." value={query} onChange={(e) => setQuery(e.target.value)}
            className="pl-11 h-12 rounded-xl bg-card border-border text-foreground placeholder:text-muted-foreground shadow-sm" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button onClick={() => setSelectedSkill(null)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${!selectedSkill ? "gradient-brand text-primary-foreground" : "bg-card border border-border text-muted-foreground"}`}>
            Todas
          </button>
          {SKILLS.slice(0, 10).map((skill) => (
            <button key={skill} onClick={() => setSelectedSkill(skill === selectedSkill ? null : skill)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedSkill === skill ? "gradient-brand text-primary-foreground" : "bg-card border border-border text-muted-foreground"}`}>
              {skill}
            </button>
          ))}
        </div>
      </div>
      <div className="px-5 space-y-3">
        <p className="text-sm text-muted-foreground">{filtered.length} resultados</p>
        {filtered.map((job, i) => <JobCard key={job.id} job={job} index={i} />)}
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Nenhuma vaga encontrada</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchTab;
