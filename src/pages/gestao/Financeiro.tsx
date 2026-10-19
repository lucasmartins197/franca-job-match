import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Lock, Receipt, Wallet } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  ContratacaoGestao, EmpresaGestao, diasDesde, useContratacoesGestao, useEmpresasGestao, useReceitaMensal, useVisaoGeral,
} from "@/hooks/useGestao";
import { STATUS_TAXA, StatusTaxa } from "@/lib/pagamentos";
import { Button } from "@/components/ui/button";
import DataTable, { Coluna } from "@/components/gestao/DataTable";
import TaxaStatusBadge from "@/components/taxas/TaxaStatusBadge";
import { Chip, Secao, SelectFiltro, Stat, TituloPagina, brl, data } from "@/components/gestao/Pecas";

const COR_TAXAS = "#0d9488";
const mesLabel = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(".", "");

const statusEmpresa = (e: EmpresaGestao) => (e.travada ? "travada" : e.perto_teto ? "perto" : "ok");
const ROTULO = { ok: "Ok", perto: "Perto do teto", travada: "Travada" } as const;

const Financeiro = () => {
  const navigate = useNavigate();
  const { data: v, isLoading } = useVisaoGeral();
  const { data: meses = [] } = useReceitaMensal(6);
  const { data: empresas = [], isLoading: loadingEmp } = useEmpresasGestao();
  const { data: contratacoes = [], isLoading: loadingC } = useContratacoesGestao();
  const [filtroEmp, setFiltroEmp] = useState("com_saldo");
  const [filtroTaxa, setFiltroTaxa] = useState("todas");

  const pf = (v?.assinantes_profissional ?? 0) * (v?.precos?.freelancer ?? 39.9);
  const pj = (v?.assinantes_empresa ?? 0) * (v?.precos?.empresa ?? 89.9);
  const travadas = empresas.filter((e) => e.travada);

  const empresasFiltradas = empresas.filter((e) =>
    filtroEmp === "todas" || (filtroEmp === "com_saldo" && e.saldo_taxas > 0) ||
    (filtroEmp === "perto" && e.perto_teto) || (filtroEmp === "travadas" && e.travada) ||
    (filtroEmp === "divergencia" && e.em_divergencia > 0)
  );
  const contratacoesFiltradas = contratacoes.filter((c) => c.status === "finalizada" && (filtroTaxa === "todas" || c.status_taxa === filtroTaxa));

  const colEmpresas: Coluna<EmpresaGestao>[] = [
    { id: "empresa", titulo: "Empresa", valor: (e) => e.nome_empresa, render: (e) => <span className="font-semibold">{e.nome_empresa}</span> },
    { id: "saldo", titulo: "Saldo devedor", valor: (e) => e.saldo_taxas, render: (e) => brl(e.saldo_taxas), alinhar: "right" },
    { id: "abertas", titulo: "Taxas em aberto", valor: (e) => e.taxas_abertas, alinhar: "right" },
    { id: "dias", titulo: "Há quanto tempo", valor: (e) => diasDesde(e.taxa_aberta_desde), alinhar: "right",
      render: (e) => (e.taxa_aberta_desde ? `${diasDesde(e.taxa_aberta_desde)} dia(s)` : "—") },
    { id: "divergencia", titulo: "Em análise", valor: (e) => e.em_divergencia, render: (e) => (e.em_divergencia ? brl(e.em_divergencia) : "—"), alinhar: "right" },
    { id: "pagas", titulo: "Já pagas", valor: (e) => e.taxas_pagas, render: (e) => brl(e.taxas_pagas), alinhar: "right" },
    { id: "status", titulo: "Status", valor: (e) => ROTULO[statusEmpresa(e)], render: (e) => <Chip tipo={statusEmpresa(e)}>{ROTULO[statusEmpresa(e)]}</Chip> },
  ];

  const colContratacoes: Coluna<ContratacaoGestao>[] = [
    { id: "data", titulo: "Finalizada", valor: (c) => c.finalizada_em, render: (c) => data(c.finalizada_em) },
    { id: "empresa", titulo: "Empresa", valor: (c) => c.empresa },
    { id: "profissional", titulo: "Profissional", valor: (c) => c.profissional },
    { id: "vaga", titulo: "Vaga", valor: (c) => c.vaga, render: (c) => <span className="block max-w-[200px] truncate">{c.vaga}</span> },
    { id: "valor", titulo: "Valor", valor: (c) => c.valor, render: (c) => brl(c.valor), alinhar: "right" },
    { id: "taxa", titulo: "Taxa 5%", valor: (c) => c.taxa, render: (c) => brl(c.taxa), alinhar: "right" },
    { id: "status_taxa", titulo: "Status da taxa", valor: (c) => (c.status_taxa ? STATUS_TAXA[c.status_taxa as StatusTaxa]?.label : ""), render: (c) => <TaxaStatusBadge status={c.status_taxa} /> },
  ];

  return (
    <div className="space-y-5">
      <TituloPagina titulo="Financeiro" sub="Valores projetados a partir das assinaturas ativas e das taxas registradas — sem pagamento real ligado." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat titulo="MRR (assinaturas ativas)" valor={brl(v?.mrr)} icon={Wallet} tom="destaque" carregando={isLoading}
          sub={`${(v?.assinantes_empresa ?? 0) + (v?.assinantes_profissional ?? 0)} assinantes`} />
        <Stat titulo="Assinatura PF (profissionais)" valor={brl(pf)} carregando={isLoading} sub={`${v?.assinantes_profissional ?? 0} × ${brl(v?.precos?.freelancer)}`} />
        <Stat titulo="Assinatura PJ (empresas)" valor={brl(pj)} carregando={isLoading} sub={`${v?.assinantes_empresa ?? 0} × ${brl(v?.precos?.empresa)}`} />
        <Stat titulo="Taxas 5% no mês" valor={brl(v?.taxas_mes)} icon={Receipt} carregando={isLoading} sub={`${brl(v?.taxas_total)} geradas no total`} />
        <Stat titulo="Taxas pagas" valor={brl(v?.taxas_pagas)} carregando={isLoading} />
        <Stat titulo="Taxas a receber" valor={brl(v?.taxas_a_receber)} tom={(v?.taxas_a_receber ?? 0) > 0 ? "alerta" : "padrao"} carregando={isLoading} />
        <Stat titulo="Empresas travadas" valor={v?.empresas_travadas ?? 0} icon={Lock} tom={(v?.empresas_travadas ?? 0) > 0 ? "perigo" : "padrao"} carregando={isLoading}
          sub={`saldo ≥ ${brl(v?.teto_taxas)}`} />
        <Stat titulo="Divergências" valor={v?.divergencias ?? 0} icon={AlertTriangle} tom={(v?.divergencias ?? 0) > 0 ? "alerta" : "padrao"} carregando={isLoading}
          sub={<button onClick={() => navigate("/admin/taxas")} className="text-primary font-semibold">Resolver →</button>} />
      </div>

      <Secao titulo="Taxas de 5% geradas por mês" direita={<span className="text-xs text-muted-foreground">últimos 6 meses · sem divergências</span>}>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={meses.map((m) => ({ ...m, label: mesLabel(m.mes) }))} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} tickFormatter={(n) => `R$${n}`} />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted))" }}
                contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 12 }}
                formatter={(val: number, _n, item) => [`${brl(val)} (${item.payload.contratacoes} contratações · ${brl(item.payload.movimentado)} movimentados)`, "Taxas"]}
              />
              <Bar dataKey="taxas" name="Taxas" fill={COR_TAXAS} radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Secao>

      {travadas.length > 0 && (
        <Secao titulo={`Empresas travadas por taxa (${travadas.length})`} className="border-destructive/30"
          direita={<Button size="sm" variant="outline" onClick={() => navigate("/admin/taxas")} className="rounded-xl">Registrar pagamento</Button>}>
          <ul className="divide-y divide-border text-sm">
            {travadas.map((e) => (
              <li key={e.id} className="py-2 flex items-center gap-2 cursor-pointer" onClick={() => navigate(`/gestao/usuario/${e.id}`)}>
                <Lock className="h-4 w-4 text-destructive" />
                <span className="flex-1 font-medium">{e.nome_empresa}</span>
                <span className="text-muted-foreground text-xs">{e.telefone}</span>
                <span className="font-semibold tabular-nums">{brl(e.saldo_taxas)}</span>
              </li>
            ))}
          </ul>
        </Secao>
      )}

      <section>
        <h2 className="font-display font-bold text-foreground mb-3">Status de taxas por empresa</h2>
        <DataTable
          dados={empresasFiltradas}
          colunas={colEmpresas}
          colunasExtrasExport={[
            { titulo: "Email", valor: (e) => e.email },
            { titulo: "Telefone", valor: (e) => e.telefone },
            { titulo: "Taxa em aberto desde", valor: (e) => e.taxa_aberta_desde },
          ]}
          chave={(e) => e.id}
          nomeExport="taxas-por-empresa"
          busca={(e) => `${e.nome_empresa} ${e.email}`}
          carregando={loadingEmp}
          onLinha={(e) => navigate(`/gestao/usuario/${e.id}`)}
          ordemInicial={{ id: "saldo", dir: "desc" }}
          vazio="Nenhuma empresa com esse filtro"
          filtros={
            <SelectFiltro rotulo="Filtro de taxas" valor={filtroEmp} onChange={setFiltroEmp} opcoes={[
              { valor: "com_saldo", label: "Com saldo devedor" }, { valor: "perto", label: "Perto do teto" },
              { valor: "travadas", label: "Travadas" }, { valor: "divergencia", label: "Com divergência" }, { valor: "todas", label: "Todas as empresas" },
            ]} />
          }
        />
      </section>

      <section>
        <h2 className="font-display font-bold text-foreground mb-3">Taxas por contratação</h2>
        <DataTable
          dados={contratacoesFiltradas}
          colunas={colContratacoes}
          colunasExtrasExport={[
            { titulo: "Valor contestado (R$)", valor: (c) => c.valor_contestado },
            { titulo: "Taxa paga em", valor: (c) => c.taxa_paga_em },
            { titulo: "Demo", valor: (c) => c.is_demo },
          ]}
          chave={(c) => c.id}
          nomeExport="taxas-por-contratacao"
          busca={(c) => `${c.empresa} ${c.profissional ?? ""} ${c.vaga}`}
          placeholderBusca="Buscar por empresa, profissional ou vaga"
          carregando={loadingC}
          onLinha={(c) => navigate(`/contratacao/${c.id}`)}
          ordemInicial={{ id: "data", dir: "desc" }}
          filtros={
            <SelectFiltro rotulo="Status da taxa" valor={filtroTaxa} onChange={setFiltroTaxa} opcoes={[
              { valor: "todas", label: "Todos os status" },
              ...(Object.keys(STATUS_TAXA) as StatusTaxa[]).map((s) => ({ valor: s, label: STATUS_TAXA[s].label })),
            ]} />
          }
        />
      </section>
    </div>
  );
};

export default Financeiro;
