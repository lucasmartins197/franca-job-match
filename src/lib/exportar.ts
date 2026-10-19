/**
 * Exportação para Excel via CSV (sem dependências).
 * Formato pensado para o Excel em português: separador ";", vírgula decimal,
 * datas dd/mm/aaaa e BOM UTF-8 (acentos corretos ao abrir com duplo clique).
 */

export type ValorCelula = string | number | boolean | null | undefined | Date | string[];

export interface ColunaExport<T> {
  titulo: string;
  valor: (linha: T) => ValorCelula;
}

const ISO_DATA = /^\d{4}-\d{2}-\d{2}(T|$)/;

const formatar = (v: ValorCelula): string => {
  if (v === null || v === undefined) return "";
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "boolean") return v ? "Sim" : "Não";
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : v.toFixed(2).replace(".", ",");
  if (v instanceof Date) return v.toLocaleDateString("pt-BR");
  if (ISO_DATA.test(v)) {
    const d = new Date(v.length === 10 ? `${v}T12:00:00` : v);
    if (!Number.isNaN(d.getTime())) return v.length === 10 ? d.toLocaleDateString("pt-BR") : d.toLocaleString("pt-BR");
  }
  return v;
};

const escapar = (s: string) => (/[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);

export const gerarCSV = <T,>(colunas: ColunaExport<T>[], linhas: T[]) =>
  [colunas.map((c) => escapar(c.titulo)).join(";"), ...linhas.map((l) => colunas.map((c) => escapar(formatar(c.valor(l)))).join(";"))].join("\r\n");

export const exportarCSV = <T,>(nomeBase: string, colunas: ColunaExport<T>[], linhas: T[]) => {
  const csv = "﻿" + gerarCSV(colunas, linhas);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `frela-${nomeBase}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
