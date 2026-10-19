import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BadgeCheck, Sparkles } from "lucide-react";
import { EmpresaGestao, diasDesde, useEmpresasGestao } from "@/hooks/useGestao";
import DataTable, { Coluna } from "@/components/gestao/DataTable";
import { Chip, SelectFiltro, TituloPagina, brl, data } from "@/components/gestao/Pecas";

const statusTaxa = (e: EmpresaGestao) => (e.travada ? "travada" : e.perto_teto ? "perto" : "ok");

const Empresas = () => {
  const navigate = useNavigate();
  const { data: empresas = [], isLoading, error } = useEmpresasGestao();
  const [status, setStatus] = useState("todos");
  const [assinatura, setAssinatura] = useState("todas");
  const [cidade, setCidade] = useState("todas");
  const [ramo, setRamo] = useState("todos");

  const cidades = useMemo(() => Array.from(new Set(empresas.map((e) => e.cidade).filter(Boolean))).sort() as string[], [empresas]);
  const ramos = useMemo(() => Array.from(new Set(empresas.map((e) => e.ramo).filter(Boolean))).sort() as string[], [empresas]);

  const filtradas = empresas.filter((e) =>
    (status === "todos" || (status === "ativos" && e.ativo) || (status === "inativos" && !e.ativo) ||
      (status === "inadimplentes" && e.inadimplente) || (status === "travadas" && e.travada)) &&
    (assinatura === "todas" || (assinatura === "assinantes") === e.assinante) &&
    (cidade === "todas" || e.cidade === cidade) &&
    (ramo === "todos" || e.ramo === ramo)
  );

  const colunas: Coluna<EmpresaGestao>[] = [
    {
      id: "nome", titulo: "Empresa", valor: (e) => e.nome_empresa,
      render: (e) => (
        <div className="min-w-[180px]">
          <p className="font-semibold text-foreground flex items-center gap-1">
            {e.nome_empresa}
            {e.verificado && <BadgeCheck className="h-3.5 w-3.5 text-primary" />}
            {e.destaque && <Sparkles className="h-3.5 w-3.5 text-amber-500" />}
          </p>
          <p className="text-xs text-muted-foreground">{e.email}</p>
        </div>
      ),
    },
    { id: "telefone", titulo: "Telefone", valor: (e) => e.telefone },
    { id: "ramo", titulo: "Ramo", valor: (e) => e.ramo },
    { id: "cidade", titulo: "Cidade", valor: (e) => e.cidade },
    {
      id: "assinatura", titulo: "Assinatura", valor: (e) => (e.assinante ? "Ativa" : "Inativa"),
      render: (e) => <Chip tipo={e.assinante ? "assinante" : "inativo"}>{e.assinante ? "Ativa" : "Inativa"}</Chip>,
    },
    { id: "contratacoes", titulo: "Contratações", valor: (e) => e.contratacoes, alinhar: "right" },
    { id: "movimentado", titulo: "Movimentado", valor: (e) => e.movimentado, render: (e) => brl(e.movimentado), alinhar: "right" },
    {
      id: "saldo", titulo: "Saldo de taxas", valor: (e) => e.saldo_taxas, alinhar: "right",
      render: (e) => (
        <span className="inline-flex items-center gap-1.5">
          {brl(e.saldo_taxas)}
          <Chip tipo={statusTaxa(e)}>{e.travada ? "Travada" : e.perto_teto ? "Perto" : "Ok"}</Chip>
        </span>
      ),
    },
    {
      id: "atividade", titulo: "Situação", valor: (e) => (e.inadimplente ? "Inadimplente" : e.ativo ? "Ativa" : "Inativa"),
      render: (e) => e.inadimplente ? <Chip tipo="travada">Inadimplente</Chip> : <Chip tipo={e.ativo ? "ativo" : "inativo"}>{e.ativo ? "Ativa" : "Inativa"}</Chip>,
    },
    { id: "cadastro", titulo: "Cadastro", valor: (e) => e.created_at, render: (e) => <span className="inline-flex items-center gap-1">{data(e.created_at)}{e.is_demo && <Chip tipo="demo">demo</Chip>}</span> },
  ];

  return (
    <div>
      <TituloPagina titulo="Empresas" sub="Clique numa empresa para ver tudo sobre ela." />
      {error && <p className="mb-3 text-sm text-destructive">{(error as Error).message}</p>}
      <DataTable
        dados={filtradas}
        colunas={colunas}
        colunasExtrasExport={[
          { titulo: "Responsável", valor: (e) => e.responsavel },
          { titulo: "Email", valor: (e) => e.email },
          { titulo: "CNPJ", valor: (e) => e.cnpj },
          { titulo: "Endereço", valor: (e) => e.endereco },
          { titulo: "Vagas", valor: (e) => e.vagas },
          { titulo: "Taxas em aberto (qtd)", valor: (e) => e.taxas_abertas },
          { titulo: "Dias com taxa em aberto", valor: (e) => diasDesde(e.taxa_aberta_desde) },
          { titulo: "Taxas pagas (R$)", valor: (e) => e.taxas_pagas },
          { titulo: "Avaliação média", valor: (e) => e.avaliacao_media },
          { titulo: "Verificada", valor: (e) => e.verificado },
          { titulo: "Última atividade", valor: (e) => e.ultima_atividade },
          { titulo: "Demo", valor: (e) => e.is_demo },
        ]}
        chave={(e) => e.id}
        nomeExport="empresas"
        busca={(e) => `${e.nome_empresa} ${e.responsavel ?? ""} ${e.email} ${e.telefone ?? ""}`}
        placeholderBusca="Buscar por nome, email ou telefone"
        carregando={isLoading}
        onLinha={(e) => navigate(`/gestao/usuario/${e.id}`)}
        ordemInicial={{ id: "cadastro", dir: "desc" }}
        filtros={
          <>
            <SelectFiltro rotulo="Situação" valor={status} onChange={setStatus} opcoes={[
              { valor: "todos", label: "Todas" }, { valor: "ativos", label: "Ativas" }, { valor: "inativos", label: "Inativas" },
              { valor: "inadimplentes", label: "Inadimplentes" }, { valor: "travadas", label: "Travadas por taxa" },
            ]} />
            <SelectFiltro rotulo="Assinatura" valor={assinatura} onChange={setAssinatura} opcoes={[
              { valor: "todas", label: "Assinatura: todas" }, { valor: "assinantes", label: "Assinantes" }, { valor: "nao", label: "Não assinantes" },
            ]} />
            <SelectFiltro rotulo="Cidade" valor={cidade} onChange={setCidade} opcoes={[{ valor: "todas", label: "Todas as cidades" }, ...cidades.map((c) => ({ valor: c, label: c }))]} />
            <SelectFiltro rotulo="Ramo" valor={ramo} onChange={setRamo} opcoes={[{ valor: "todos", label: "Todos os ramos" }, ...ramos.map((r) => ({ valor: r, label: r }))]} />
          </>
        }
      />
    </div>
  );
};

export default Empresas;
