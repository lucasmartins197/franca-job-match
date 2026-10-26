import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BadgeCheck, Sparkles, Star } from "lucide-react";
import { ProfissionalGestao, useProfissionaisGestao } from "@/hooks/useGestao";
import DataTable, { Coluna } from "@/components/gestao/DataTable";
import { Chip, SelectFiltro, TituloPagina, brl, data } from "@/components/gestao/Pecas";

const Profissionais = () => {
  const navigate = useNavigate();
  const { data: pros = [], isLoading, error } = useProfissionaisGestao();
  const [status, setStatus] = useState("todos");
  const [cidade, setCidade] = useState("todas");
  const [profissao, setProfissao] = useState("todas");

  const cidades = useMemo(() => Array.from(new Set(pros.map((p) => p.cidade).filter(Boolean))).sort() as string[], [pros]);
  const profissoes = useMemo(() => Array.from(new Set(pros.flatMap((p) => p.profissoes ?? []))).sort(), [pros]);

  const filtrados = pros.filter((p) =>
    (status === "todos" || (status === "ativos" && p.ativo) || (status === "inativos" && !p.ativo) ||
      (status === "verificados" && p.verificado) || (status === "sem_trabalho" && p.trabalhos === 0)) &&
    (cidade === "todas" || p.cidade === cidade) &&
    (profissao === "todas" || (p.profissoes ?? []).includes(profissao))
  );

  const colunas: Coluna<ProfissionalGestao>[] = [
    {
      id: "nome", titulo: "Profissional", valor: (p) => p.nome,
      render: (p) => (
        <div className="min-w-[170px]">
          <p className="font-semibold text-foreground flex items-center gap-1">
            {p.nome || "—"}
            {p.verificado && <BadgeCheck className="h-3.5 w-3.5 text-primary" />}
            {p.destaque && <Sparkles className="h-3.5 w-3.5 text-amber-500" />}
          </p>
          <p className="text-xs text-muted-foreground">{p.email}</p>
        </div>
      ),
    },
    { id: "telefone", titulo: "Telefone", valor: (p) => p.telefone },
    {
      id: "profissoes", titulo: "Profissões", valor: (p) => p.profissoes ?? [],
      render: (p) => <span className="block max-w-[220px] truncate" title={(p.profissoes ?? []).join(", ")}>{(p.profissoes ?? []).join(", ") || "—"}</span>,
    },
    { id: "cidade", titulo: "Cidade", valor: (p) => p.cidade },
    {
      id: "avaliacao", titulo: "Avaliação", valor: (p) => p.avaliacao_media, alinhar: "right",
      render: (p) => p.total_avaliacoes ? <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{Number(p.avaliacao_media).toFixed(1)} <span className="text-muted-foreground">({p.total_avaliacoes})</span></span> : "—",
    },
    { id: "trabalhos", titulo: "Trabalhos", valor: (p) => p.trabalhos, alinhar: "right" },
    { id: "ganhos", titulo: "Ganhos", valor: (p) => p.ganhos, render: (p) => brl(p.ganhos), alinhar: "right" },
    { id: "selo", titulo: "Selo", valor: (p) => (p.verificado ? "Verificado" : ""), render: (p) => p.verificado ? <Chip tipo="assinante">Verificado</Chip> : "—" },
    {
      id: "ativo", titulo: "Situação", valor: (p) => (p.ativo ? "Ativo" : "Inativo"),
      render: (p) => <Chip tipo={p.ativo ? "ativo" : "inativo"}>{p.ativo ? "Ativo" : "Inativo"}</Chip>,
    },
    { id: "cadastro", titulo: "Cadastro", valor: (p) => p.created_at, render: (p) => <span className="inline-flex items-center gap-1">{data(p.created_at)}{p.is_demo && <Chip tipo="demo">demo</Chip>}</span> },
  ];

  return (
    <div>
      <TituloPagina titulo="Profissionais" sub="Clique num profissional para ver tudo sobre ele." />
      {error && <p className="mb-3 text-sm text-destructive">{(error as Error).message}</p>}
      <DataTable
        dados={filtrados}
        colunas={colunas}
        colunasExtrasExport={[
          { titulo: "Email", valor: (p) => p.email },
          { titulo: "Total de avaliações", valor: (p) => p.total_avaliacoes },
          { titulo: "Candidaturas", valor: (p) => p.candidaturas },
          { titulo: "Fotos no portfólio", valor: (p) => p.fotos_portfolio },
          { titulo: "Disponibilidade", valor: (p) => p.disponibilidade },
          { titulo: "Destaque", valor: (p) => p.destaque },
          { titulo: "Selos extras", valor: (p) => p.selos_extras },
          { titulo: "Código de indicação", valor: (p) => p.codigo_indicacao },
          { titulo: "Última atividade", valor: (p) => p.ultima_atividade },
          { titulo: "Demo", valor: (p) => p.is_demo },
        ]}
        chave={(p) => p.id}
        nomeExport="profissionais"
        busca={(p) => `${p.nome ?? ""} ${p.email} ${p.telefone ?? ""}`}
        placeholderBusca="Buscar por nome, email ou telefone"
        carregando={isLoading}
        onLinha={(p) => navigate(`/gestao/usuario/${p.id}`)}
        ordemInicial={{ id: "cadastro", dir: "desc" }}
        filtros={
          <>
            <SelectFiltro rotulo="Situação" valor={status} onChange={setStatus} opcoes={[
              { valor: "todos", label: "Todos" }, { valor: "ativos", label: "Ativos" }, { valor: "inativos", label: "Inativos" },
              { valor: "verificados", label: "Verificados" }, { valor: "sem_trabalho", label: "Sem trabalhos ainda" },
            ]} />
            <SelectFiltro rotulo="Cidade" valor={cidade} onChange={setCidade} opcoes={[{ valor: "todas", label: "Todas as cidades" }, ...cidades.map((c) => ({ valor: c, label: c }))]} />
            <SelectFiltro rotulo="Profissão" valor={profissao} onChange={setProfissao} opcoes={[{ valor: "todas", label: "Todas as profissões" }, ...profissoes.map((c) => ({ valor: c, label: c }))]} />
          </>
        }
      />
    </div>
  );
};

export default Profissionais;
