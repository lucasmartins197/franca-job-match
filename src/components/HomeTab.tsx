import { useState } from "react";
import { Search, SearchX, MapPin, ChevronRight, Star, BadgeCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRecomendadasEmpresas } from "@/hooks/useRecomendacoes";
import { Input } from "@/components/ui/input";
import JobCard from "@/components/JobCard";
import CategoryGrid from "@/components/CategoryGrid";
import NotificationBell from "@/components/frela/NotificationBell";
import EmptyState from "@/components/frela/EmptyState";
import { JobListSkeleton } from "@/components/frela/JobCardSkeleton";
import UserAvatar from "@/components/frela/UserAvatar";
import { CATEGORIAS, categoriaDe } from "@/lib/categorias";
import { useJobs } from "@/hooks/useJobs";
import { useProfilesByIds } from "@/hooks/useFrela";
import { useMeuPerfil } from "@/hooks/usePerfil";

const saudacao = () => {
  const h = new Date().getHours();
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
};

const HomeTab = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { data: perfil } = useMeuPerfil();
  const { data: jobs = [], isLoading } = useJobs();
  const { data: empresas = {} } = useProfilesByIds(jobs.map((j) => j.user_id));
  const { data: lugares = [] } = useRecomendadasEmpresas(8);
  const navigate = useNavigate();

  const contagem: Record<string, number> = {};
  for (const j of jobs) {
    const id = categoriaDe(j.category)?.id;
    if (id) contagem[id] = (contagem[id] ?? 0) + 1;
  }
  const nomeCategoria = CATEGORIAS.find((c) => c.id === selectedCategory)?.nome;
  const profile = perfil?.profile;
  const nome = profile?.nome || "Usuário";

  const filteredJobs = jobs.filter((job) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q || [job.title, job.company_name, job.skill, job.neighborhood].some((t) => t?.toLowerCase().includes(q));
    const matchesCategory = !selectedCategory || categoriaDe(job.category)?.id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="pb-24">
      <header className="px-5 pt-10 pb-5 bg-gradient-to-b from-primary/10 to-transparent">
        <div className="flex items-center gap-3 mb-5">
          <UserAvatar nome={nome} fotoUrl={profile?.foto_url} size="md" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">{saudacao()},</p>
            <h1 className="text-xl font-display font-bold text-foreground truncate">{nome.split(" ")[0]} 👋</h1>
          </div>
          <NotificationBell />
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por vaga, empresa ou bairro"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-12 rounded-2xl bg-card border-border shadow-card"
          />
        </div>
      </header>

      <div className="px-5 space-y-5">
        <section>
          <h2 className="font-display font-bold text-lg text-foreground mb-3">O que você procura?</h2>
          <CategoryGrid onSelect={setSelectedCategory} selected={selectedCategory} contagem={contagem} />
        </section>

        {!selectedCategory && !searchQuery && lugares.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-bold text-base text-foreground">Melhores lugares para trabalhar</h2>
              <button onClick={() => navigate("/melhores-lugares")} className="text-sm font-semibold text-primary flex items-center shrink-0">Ver todos <ChevronRight className="h-4 w-4" /></button>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5 pb-1">
              {lugares.slice(0, 8).map((e) => (
                <button key={e.id} onClick={() => navigate(`/perfil/${e.id}`)}
                  className="shrink-0 w-36 text-left bg-card border border-border rounded-2xl p-3 shadow-card hover:border-primary/40">
                  <UserAvatar nome={e.nome_empresa} fotoUrl={e.foto_url} size="md" />
                  <p className="font-semibold text-sm text-foreground mt-2 truncate">{e.nome_empresa}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {e.total_avaliacoes ? Number(e.avaliacao_media).toFixed(1) : "—"} · {e.contratacoes} contrat.
                  </p>
                  {e.vagas_abertas > 0 && <p className="text-[11px] font-semibold text-primary mt-0.5">{e.vagas_abertas} vaga{e.vagas_abertas === 1 ? "" : "s"} aberta{e.vagas_abertas === 1 ? "" : "s"}</p>}
                  {e.verificado && <p className="text-[11px] text-muted-foreground mt-0.5 inline-flex items-center gap-0.5"><BadgeCheck className="h-3 w-3 text-primary" /> Verificada</p>}
                </button>
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="flex items-end justify-between mb-3">
            <div>
              <h2 className="font-display font-bold text-lg text-foreground">{nomeCategoria ?? "Vagas abertas"}</h2>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {profile?.cidade || "Franca"}, SP
              </p>
            </div>
            {!isLoading && <span className="text-xs font-medium text-muted-foreground">{filteredJobs.length} vaga{filteredJobs.length === 1 ? "" : "s"}</span>}
          </div>

          {isLoading ? (
            <JobListSkeleton />
          ) : filteredJobs.length === 0 ? (
            jobs.length === 0 ? (
              <EmptyState icon={Search} titulo="Nenhuma vaga aberta agora"
                descricao="Novas vagas aparecem aqui assim que as empresas publicarem. Deixe seu perfil caprichado enquanto isso!" />
            ) : (
              <EmptyState icon={SearchX} titulo="Nada encontrado com esse filtro"
                acao={<button onClick={() => { setSearchQuery(""); setSelectedCategory(null); }} className="text-sm font-semibold text-primary">Limpar filtros</button>} />
            )
          ) : (
            <div className="space-y-3">
              {filteredJobs.map((job, i) => (
                <JobCard key={job.id} job={job} index={i} fotoEmpresa={empresas[job.user_id]?.foto_url}
                  notaEmpresa={empresas[job.user_id]?.avaliacao_media} totalAvaliacoesEmpresa={empresas[job.user_id]?.total_avaliacoes} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default HomeTab;
