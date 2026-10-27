import { useEffect, useRef, useState } from "react";

/**
 * Rolagem infinita sobre uma lista já carregada: mostra `passo` itens e
 * libera mais quando o sentinela entra na tela. Volta ao início quando `chave` muda (ex.: filtros).
 */
export const useListaInfinita = <T,>(itens: T[], chave: string, passo = 10) => {
  const [qtd, setQtd] = useState(passo);
  const sentinela = useRef<HTMLDivElement | null>(null);

  useEffect(() => setQtd(passo), [chave, passo]);

  useEffect(() => {
    const el = sentinela.current;
    if (!el || qtd >= itens.length || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver((entradas) => {
      if (entradas.some((e) => e.isIntersecting)) setQtd((q) => q + passo);
    }, { rootMargin: "400px 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [qtd, itens.length, passo]);

  return { visiveis: itens.slice(0, qtd), temMais: qtd < itens.length, sentinela };
};
