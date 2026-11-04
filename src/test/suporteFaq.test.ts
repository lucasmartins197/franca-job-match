import { describe, expect, it } from "vitest";
import { SAUDACAO, TOPICOS, detectarIntencao, preencher, topicosPara } from "@/lib/suporteFaq";

const id = (t: string, tipo: "empresa" | "profissional") => detectarIntencao(t, tipo)?.id ?? null;

describe("assistente de suporte", () => {
  it("monta a saudação com nome, app e assistente", () => {
    expect(preencher(SAUDACAO.empresa, "Lucas Martins")).toMatch(/^Oi, Lucas! Eu sou a Vera/);
    expect(preencher(SAUDACAO.profissional, null)).toMatch(/^Oi! Eu sou a Vera/);
    expect(preencher("{app}")).not.toContain("{");
  });

  it("mostra dúvidas diferentes por tipo (+ gerais)", () => {
    const emp = topicosPara("empresa").map((t) => t.id);
    const pro = topicosPara("profissional").map((t) => t.id);
    expect(emp).toContain("criar-vaga");
    expect(emp).not.toContain("gratis");
    expect(pro).toContain("gratis");
    expect(pro).not.toContain("criar-vaga");
    expect(emp).toContain("senha");
    expect(pro).toContain("senha");
  });

  it("detecta a intenção por palavras-chave", () => {
    expect(id("quanto é a taxa?", "empresa")).toBe("taxa");
    expect(id("por que me cobraram 5%", "empresa")).toBe("taxa");
    expect(id("quero publicar uma vaga", "empresa")).toBe("criar-vaga");
    expect(id("não consigo criar vaga nova", "empresa")).toBe("trava-vaga");
    expect(id("como indico outra empresa e ganho desconto", "empresa")).toBe("indique-ganhe");
    expect(id("como me candidatar", "profissional")).toBe("candidatar");
    expect(id("quando vou receber o pagamento?", "profissional")).toBe("pagamento-trabalho");
    expect(id("tenho que pagar alguma coisa? é grátis?", "profissional")).toBe("gratis");
    expect(id("o código não funciona", "profissional")).toBe("codigo");
    expect(id("esqueci a senha", "empresa")).toBe("senha");
    expect(id("como ganho o selo", "profissional")).toBe("selo-indicado");
    expect(id("Como funciona o FreLa?", "profissional")).toBe("como-funciona");
  });

  it("não inventa resposta quando não entende", () => {
    expect(id("bom dia", "empresa")).toBeNull();
    expect(id("asdfgh", "profissional")).toBeNull();
  });

  it("todo tópico tem pergunta, resposta e palavras", () => {
    for (const t of TOPICOS) {
      expect(t.pergunta && t.resposta && t.palavras.length).toBeTruthy();
    }
    expect(new Set(TOPICOS.map((t) => t.id)).size).toBe(TOPICOS.length);
  });
});
