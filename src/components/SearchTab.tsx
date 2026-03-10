import { useState } from "react";
import { Search, MapPin, Filter, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import JobCard from "@/components/JobCard";
import JobDetailSheet from "@/components/JobDetailSheet";
import { mockJobs, SKILLS, NEIGHBORHOODS } from "@/data/mockData";
import { Job, Skill } from "@/types";

const SearchTab = () => {
  const [query, setQuery] = useState("");
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const filtered = mockJobs.filter((job) => {
    const matchQ = !query || job.title.toLowerCase().includes(query.toLowerCase()) || job.companyName.toLowerCase().includes(query.toLowerCase());
    const matchS = !selectedSkill || job.skill === selectedSkill;
    return matchQ && matchS;
  });

  return (
    <div className="pb-20 pt-12">
      <div className="px-5 mb-4">
        <h1 className="text-2xl font-extrabold text-foreground mb-4">Buscar Vagas</h1>
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cargo, empresa ou habilidade..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-11 h-12 rounded-xl"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Badge
            onClick={() => setSelectedSkill(null)}
            className={`cursor-pointer shrink-0 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              !selectedSkill ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            Todas
          </Badge>
          {SKILLS.slice(0, 12).map((skill) => (
            <Badge
              key={skill}
              onClick={() => setSelectedSkill(skill === selectedSkill ? null : skill)}
              className={`cursor-pointer shrink-0 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                selectedSkill === skill ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {skill}
            </Badge>
          ))}
        </div>
      </div>

      <div className="px-5 space-y-3">
        <p className="text-sm text-muted-foreground">{filtered.length} resultados</p>
        {filtered.map((job, i) => (
          <JobCard key={job.id} job={job} index={i} onClick={() => setSelectedJob(job)} />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">🔍</div>
            <p className="text-muted-foreground font-medium">Nenhuma vaga encontrada</p>
          </div>
        )}
      </div>

      <JobDetailSheet job={selectedJob} onClose={() => setSelectedJob(null)} />
    </div>
  );
};

export default SearchTab;
