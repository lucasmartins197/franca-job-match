import { Loader2 } from "lucide-react";
import JobCard from "@/components/JobCard";
import type { DbProfile } from "@/hooks/useFrela";
import type { VagaLocalizada } from "@/lib/filtrosVagas";
import { useListaInfinita } from "@/hooks/useListaInfinita";

/** Lista de vagas com rolagem infinita. */
const ListaVagas = ({ vagas, empresas, chave, mostrarDistancia }: {
  vagas: VagaLocalizada[]; empresas: Record<string, DbProfile>; chave: string; mostrarDistancia: boolean;
}) => {
  const { visiveis, temMais, sentinela } = useListaInfinita(vagas, chave, 10);
  return (
    <div className="space-y-3">
      {visiveis.map((v, i) => (
        <JobCard key={v.job.id} job={v.job} index={i % 10} empresa={empresas[v.job.user_id]} distanciaKm={mostrarDistancia ? v.distanciaKm : null} />
      ))}
      {temMais && (
        <div ref={sentinela} className="flex justify-center py-4 text-muted-foreground" aria-hidden>
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}
    </div>
  );
};

export default ListaVagas;
