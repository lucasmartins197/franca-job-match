import { useCallback, useSyncExternalStore } from "react";

/**
 * Vagas salvas (o "coração" do card). Ficam no aparelho (localStorage) —
 * é um atalho pessoal, não precisa de banco.
 */
const CHAVE = "frela-vagas-salvas";
const ouvintes = new Set<() => void>();

const ler = (): string[] => {
  try {
    const v = JSON.parse(localStorage.getItem(CHAVE) ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};

let cache = ler();

const gravar = (ids: string[]) => {
  cache = ids;
  try {
    localStorage.setItem(CHAVE, JSON.stringify(ids));
  } catch {
    /* sem storage: vale só nesta sessão */
  }
  ouvintes.forEach((f) => f());
};

const assinar = (f: () => void) => {
  ouvintes.add(f);
  return () => ouvintes.delete(f);
};

export const useVagasSalvas = () => {
  const salvas = useSyncExternalStore(assinar, () => cache, () => cache);
  const alternar = useCallback((id: string) => {
    gravar(cache.includes(id) ? cache.filter((x) => x !== id) : [id, ...cache].slice(0, 100));
  }, []);
  return { salvas, ehSalva: (id: string) => salvas.includes(id), alternar };
};
