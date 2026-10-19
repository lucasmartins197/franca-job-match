import { describe, expect, it } from "vitest";
import { gerarCSV } from "@/lib/exportar";

describe("gerarCSV (Excel pt-BR)", () => {
  it("usa ; como separador, vírgula decimal, datas pt-BR e escapa aspas", () => {
    const csv = gerarCSV(
      [
        { titulo: "Nome", valor: (l: { nome: string }) => l.nome },
        { titulo: "Valor", valor: (l: { valor: number }) => l.valor },
        { titulo: "Data", valor: () => "2026-10-19" },
        { titulo: "Ativo", valor: () => true },
        { titulo: "Lista", valor: () => ["Garçom", "Bartender"] },
      ],
      [{ nome: 'Bar "do Zé"; Centro', valor: 7.5 }] as never[]
    );
    const [cab, linha] = csv.split("\r\n");
    expect(cab).toBe("Nome;Valor;Data;Ativo;Lista");
    expect(linha).toBe('"Bar ""do Zé""; Centro";7,50;19/10/2026;Sim;Garçom, Bartender');
  });

  it("deixa vazio para nulos e mantém inteiros sem casas", () => {
    const csv = gerarCSV([{ titulo: "A", valor: () => null }, { titulo: "B", valor: () => 3 }], [{}]);
    expect(csv.split("\r\n")[1]).toBe(";3");
  });
});
