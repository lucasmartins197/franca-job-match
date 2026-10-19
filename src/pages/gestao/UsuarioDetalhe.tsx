import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink, Headset, Loader2, Mail, MapPin, Phone, Star } from "lucide-react";
import { useUsuarioDetalhe } from "@/hooks/useGestao";
import { exportarCSV } from "@/lib/exportar";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/frela/UserAvatar";
import TaxaStatusBadge from "@/components/taxas/TaxaStatusBadge";
import StatusBadge from "@/components/frela/StatusBadge";
import PromoverPainel from "@/components/gestao/PromoverPainel";
import { Chip, Secao, Stat, brl, data } from "@/components/gestao/Pecas";

/** Tudo sobre um usuário (empresa ou profissional). */
const UsuarioDetalhe = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: d, isLoading, error } = useUsuarioDetalhe(id);

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (error) return <p className="text-sm text-destructive">{(error as Error).message}</p>;
  if (!d) return <p className="text-sm text-muted-foreground">Usuário não encontrado.</p>;

  const p = d.profile;
  const isEmpresa = p.tipo === "empresa";
  const nome = (isEmpresa ? (d.empresa?.nome_empresa as string | null) : null) || p.nome || "—";
  const assinante = p.subscription_status === "active" && (!p.subscription_end || new Date(p.subscription_end) > new Date());
  const finalizadas = d.contratacoes.filter((c) => c.status === "finalizada");
  const movimentado = finalizadas.reduce((s, c) => s + Number(c.valor), 0);

  const exportarContratacoes = () =>
    exportarCSV(`contratacoes-${(nome || "usuario").toLowerCase().replace(/\s+/g, "-")}`, [
      { titulo: "Vaga", valor: (c) => c.vaga },
      { titulo: isEmpresa ? "Profissional" : "Empresa", valor: (c) => c.outra_parte },
      { titulo: "Valor (R$)", valor: (c) => Number(c.valor) },
      { titulo: "Status", valor: (c) => c.status },
      { titulo: "Status da taxa", valor: (c) => c.status_taxa },
      { titulo: "Taxa (R$)", valor: (c) => Number(c.taxa) },
      { titulo: "Criada em", valor: (c) => c.criada_em },
      { titulo: "Finalizada em", valor: (c) => c.finalizada_em },
    ], d.contratacoes);

  return (
    <div className="space-y-4">
      <button onClick={() => navigate(-1)} className="text-sm text-muted-foreground inline-flex items-center gap-1"><ArrowLeft className="h-4 w-4" /> Voltar</button>

      <section className="bg-card border border-border rounded-2xl p-4 lg:p-5 shadow-card flex flex-wrap gap-4 items-start">
        <UserAvatar nome={nome} fotoUrl={p.foto_url} size="xl" />
        <div className="flex-1 min-w-[220px]">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-display font-bold text-foreground">{nome}</h1>
            <Chip tipo="inativo">{isEmpresa ? "Empresa" : "Profissional"}</Chip>
            {assinante ? <Chip tipo="assinante">Assinante</Chip> : <Chip tipo="inativo">Sem assinatura</Chip>}
            {p.is_demo && <Chip tipo="demo">demo</Chip>}
          </div>
          {isEmpresa && p.nome && <p className="text-sm text-muted-foreground">Responsável: {p.nome}</p>}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {p.email}</span>
            {p.telefone && <a href={`tel:${p.telefone}`} className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {p.telefone}</a>}
            <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {p.cidade || "—"}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Cadastro {data(p.created_at)} · última atividade {data(p.ultima_atividade)}
            {p.codigo_indicacao ? ` · código de indicação ${p.codigo_indicacao}` : ""}
            {d.indicado_por_nome ? ` · indicado por ${d.indicado_por_nome}` : ""}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/perfil/${p.id}`)} className="rounded-xl"><ExternalLink className="h-4 w-4 mr-1.5" /> Perfil no app</Button>
          <Button variant="outline" size="sm" onClick={() => navigate(`/admin/suporte/${p.id}`)} className="rounded-xl"><Headset className="h-4 w-4 mr-1.5" /> Suporte ({d.suporte_mensagens})</Button>
        </div>
      </section>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat titulo="Avaliação" valor={p.total_avaliacoes ? <span className="inline-flex items-center gap-1"><Star className="h-5 w-5 fill-amber-400 text-amber-400" />{Number(p.avaliacao_media).toFixed(1)}</span> : "—"} sub={`${p.total_avaliacoes} avaliações`} />
        <Stat titulo={isEmpresa ? "Contratações" : "Trabalhos"} valor={finalizadas.length} sub={`${d.contratacoes.length} no total`} />
        <Stat titulo={isEmpresa ? "Movimentado" : "Ganhos"} valor={brl(movimentado)} />
        {isEmpresa
          ? <Stat titulo="Saldo de taxas" valor={brl(d.saldo_taxas)} tom={Number(d.saldo_taxas) > 0 ? "alerta" : "padrao"} />
          : <Stat titulo="Candidaturas" valor={d.candidaturas.length} />}
      </div>

      <PromoverPainel usuario={{
        id: p.id, nome, tipo: p.tipo, verificado: p.verificado, destaque: p.destaque, selos_extras: p.selos_extras ?? [],
        meta_ajuste_trabalhos: p.meta_ajuste_trabalhos ?? 0, trabalhos: finalizadas.length,
      }} />

      {!isEmpresa && d.profissional && (
        <Secao titulo="Currículo">
          <div className="grid lg:grid-cols-2 gap-3 text-sm">
            <p><b>Profissões:</b> {(d.profissional.profissoes ?? []).join(", ") || "—"}</p>
            <p><b>Disponibilidade:</b> {d.profissional.disponibilidade || "—"}</p>
            <p className="lg:col-span-2"><b>Experiência:</b> {d.profissional.experiencia || "—"}</p>
            <p className="lg:col-span-2"><b>Sobre:</b> {d.profissional.bio || "—"}</p>
            <p><b>Instagram:</b> {d.profissional.instagram ? `@${d.profissional.instagram}` : "—"}</p>
            <p><b>LinkedIn:</b> {d.profissional.linkedin || "—"}</p>
          </div>
        </Secao>
      )}
      {isEmpresa && d.empresa && (
        <Secao titulo="Dados da empresa">
          <div className="grid lg:grid-cols-2 gap-3 text-sm">
            <p><b>Ramo:</b> {String(d.empresa.ramo ?? "—")}</p>
            <p><b>CNPJ:</b> {String(d.empresa.cnpj ?? "—")}</p>
            <p className="lg:col-span-2"><b>Endereço:</b> {String(d.empresa.endereco ?? "—")}</p>
            <p className="lg:col-span-2"><b>Sobre:</b> {String(d.empresa.bio ?? "—")}</p>
          </div>
        </Secao>
      )}

      <Secao titulo={`Contratações (${d.contratacoes.length})`}
        direita={d.contratacoes.length > 0 && <Button variant="outline" size="sm" onClick={exportarContratacoes} className="rounded-xl">Exportar Excel</Button>}>
        {d.contratacoes.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma contratação.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground"><tr>
                <th className="text-left py-2">Vaga</th><th className="text-left">{isEmpresa ? "Profissional" : "Empresa"}</th>
                <th className="text-right">Valor</th><th className="text-left pl-3">Status</th><th className="text-right">Taxa</th><th className="text-right">Data</th>
              </tr></thead>
              <tbody className="divide-y divide-border">
                {d.contratacoes.map((c) => (
                  <tr key={c.id} className="cursor-pointer hover:bg-muted/40" onClick={() => navigate(`/contratacao/${c.id}`)}>
                    <td className="py-2 pr-2">{c.vaga}</td><td className="pr-2">{c.outra_parte}</td>
                    <td className="text-right tabular-nums">{brl(c.valor)}</td>
                    <td className="pl-3"><StatusBadge status={c.status} /></td>
                    <td className="text-right"><span className="inline-flex items-center gap-1.5 justify-end">{brl(c.taxa)}<TaxaStatusBadge status={c.status_taxa} /></span></td>
                    <td className="text-right text-muted-foreground">{data(c.finalizada_em ?? c.criada_em)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Secao>

      <div className="grid lg:grid-cols-2 gap-4">
        {isEmpresa ? (
          <Secao titulo={`Vagas (${d.vagas.length})`}>
            {d.vagas.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma vaga.</p> : (
              <ul className="divide-y divide-border text-sm">
                {d.vagas.map((v) => (
                  <li key={v.id} className="py-2 flex items-center gap-2">
                    <span className="flex-1 truncate">{v.titulo}</span>
                    <span className="text-xs text-muted-foreground">{data(v.data)} · {v.candidaturas} cand.</span>
                    <StatusBadge status={v.status} />
                  </li>
                ))}
              </ul>
            )}
          </Secao>
        ) : (
          <Secao titulo={`Candidaturas (${d.candidaturas.length})`}>
            {d.candidaturas.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma candidatura.</p> : (
              <ul className="divide-y divide-border text-sm">
                {d.candidaturas.map((c, i) => (
                  <li key={i} className="py-2 flex items-center gap-2">
                    <span className="flex-1 truncate">{c.vaga} <span className="text-muted-foreground">· {c.empresa}</span></span>
                    <StatusBadge status={c.status} />
                  </li>
                ))}
              </ul>
            )}
          </Secao>
        )}
        <Secao titulo={`Avaliações recebidas (${d.avaliacoes.length})`}>
          {d.avaliacoes.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma avaliação.</p> : (
            <ul className="space-y-2 text-sm">
              {d.avaliacoes.map((a, i) => (
                <li key={i}>
                  <span className="inline-flex items-center gap-1 font-semibold"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{a.nota}</span>
                  <span className="text-muted-foreground"> · {a.de} · {data(a.criada_em)}</span>
                  {a.comentario && <p className="text-muted-foreground">"{a.comentario}"</p>}
                </li>
              ))}
            </ul>
          )}
        </Secao>
        <Secao titulo={`Pagamentos (${d.pagamentos.length})`}>
          {d.pagamentos.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum pagamento registrado.</p> : (
            <ul className="divide-y divide-border text-sm">
              {d.pagamentos.map((g, i) => (
                <li key={i} className="py-2 flex justify-between gap-2">
                  <span>{g.tipo === "taxa_5pct" ? "Taxa 5%" : "Assinatura"} <span className="text-muted-foreground">· {data(g.criado_em)} · {g.referencia ?? "—"}</span></span>
                  <span className="tabular-nums">{brl(g.valor)}</span>
                </li>
              ))}
            </ul>
          )}
        </Secao>
        <Secao titulo={`Indicou (${d.indicados.length})`}>
          {d.indicados.length === 0 ? <p className="text-sm text-muted-foreground">Ninguém indicado ainda.</p> : (
            <ul className="divide-y divide-border text-sm">
              {d.indicados.map((i) => (
                <li key={i.id} className="py-2 flex justify-between cursor-pointer" onClick={() => navigate(`/gestao/usuario/${i.id}`)}>
                  <span>{i.nome} <span className="text-muted-foreground">· {i.tipo === "empresa" ? "empresa" : "profissional"}</span></span>
                  <span className="text-muted-foreground">{data(i.criado_em)}</span>
                </li>
              ))}
            </ul>
          )}
        </Secao>
      </div>
    </div>
  );
};

export default UsuarioDetalhe;
