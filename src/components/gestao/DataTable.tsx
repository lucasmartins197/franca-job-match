import { ReactNode, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown, Download, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ColunaExport, ValorCelula, exportarCSV } from "@/lib/exportar";
import { cn } from "@/lib/utils";

export interface Coluna<T> {
  id: string;
  titulo: string;
  /** Valor para ordenar e exportar */
  valor: (linha: T) => ValorCelula;
  /** Renderização na tela (padrão: valor) */
  render?: (linha: T) => ReactNode;
  alinhar?: "left" | "right" | "center";
  /** Não exportar esta coluna */
  semExport?: boolean;
  className?: string;
}

interface Props<T> {
  dados: T[];
  colunas: Coluna<T>[];
  /** Campos extras só para o arquivo exportado */
  colunasExtrasExport?: ColunaExport<T>[];
  chave: (linha: T) => string;
  nomeExport: string;
  busca?: (linha: T) => string;
  placeholderBusca?: string;
  filtros?: ReactNode;
  onLinha?: (linha: T) => void;
  carregando?: boolean;
  vazio?: string;
  ordemInicial?: { id: string; dir: "asc" | "desc" };
}

const comparar = (a: ValorCelula, b: ValorCelula) => {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "boolean" && typeof b === "boolean") return Number(a) - Number(b);
  return String(a).localeCompare(String(b), "pt-BR", { numeric: true });
};

/** Tabela do painel: busca, ordenação por coluna, contagem e exportação (CSV p/ Excel) do que está filtrado. */
function DataTable<T>({ dados, colunas, colunasExtrasExport = [], chave, nomeExport, busca, placeholderBusca = "Buscar por nome ou email",
  filtros, onLinha, carregando, vazio = "Nada encontrado", ordemInicial }: Props<T>) {
  const [q, setQ] = useState("");
  const [ordem, setOrdem] = useState(ordemInicial ?? null);

  const visiveis = useMemo(() => {
    const termo = q.trim().toLowerCase();
    let r = termo && busca ? dados.filter((d) => busca(d).toLowerCase().includes(termo)) : dados;
    if (ordem) {
      const col = colunas.find((c) => c.id === ordem.id);
      if (col) r = [...r].sort((a, b) => comparar(col.valor(a), col.valor(b)) * (ordem.dir === "asc" ? 1 : -1));
    }
    return r;
  }, [dados, q, busca, ordem, colunas]);

  const alternar = (id: string) =>
    setOrdem((o) => (o?.id === id ? (o.dir === "desc" ? { id, dir: "asc" } : null) : { id, dir: "desc" }));

  const exportar = () =>
    exportarCSV(nomeExport, [...colunas.filter((c) => !c.semExport).map((c) => ({ titulo: c.titulo, valor: c.valor })), ...colunasExtrasExport], visiveis);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {busca && (
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholderBusca} className="pl-9 h-10 rounded-xl bg-card" />
          </div>
        )}
        {filtros}
        <Button variant="outline" onClick={exportar} disabled={!visiveis.length} className="h-10 rounded-xl ml-auto">
          <Download className="h-4 w-4 mr-1.5" /> Exportar Excel
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{visiveis.length} de {dados.length} registro{dados.length === 1 ? "" : "s"}</p>
      <div className="bg-card border border-border rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs text-muted-foreground">
            <tr>
              {colunas.map((c) => (
                <th key={c.id} className={cn("px-3 py-2.5 font-semibold whitespace-nowrap", c.alinhar === "right" ? "text-right" : c.alinhar === "center" ? "text-center" : "text-left")}>
                  <button onClick={() => alternar(c.id)} className="inline-flex items-center gap-1 hover:text-foreground">
                    {c.titulo}
                    {ordem?.id === c.id ? (ordem.dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ChevronsUpDown className="h-3 w-3 opacity-40" />}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {carregando ? (
              [0, 1, 2, 3].map((i) => (
                <tr key={i}><td colSpan={colunas.length} className="px-3 py-3"><Skeleton className="h-5 w-full" /></td></tr>
              ))
            ) : visiveis.length === 0 ? (
              <tr><td colSpan={colunas.length} className="px-3 py-10 text-center text-muted-foreground">{vazio}</td></tr>
            ) : (
              visiveis.map((l) => (
                <tr key={chave(l)} onClick={onLinha ? () => onLinha(l) : undefined}
                  className={cn(onLinha && "cursor-pointer hover:bg-muted/40")}>
                  {colunas.map((c) => (
                    <td key={c.id} className={cn("px-3 py-2.5 whitespace-nowrap", c.alinhar === "right" ? "text-right tabular-nums" : c.alinhar === "center" ? "text-center" : "", c.className)}>
                      {c.render ? c.render(l) : String(c.valor(l) ?? "—")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
