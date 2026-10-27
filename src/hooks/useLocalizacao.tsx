import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { FRANCA, Ponto, arredondarRegiao, dentroDaCobertura } from "@/lib/geo";

/**
 * Localização do usuário (GPS do aparelho, com permissão).
 *  • Pedida ao abrir o app (profissional), para mostrar as vagas mais próximas.
 *  • A posição exata fica só na memória; no aparelho e no banco guardamos a
 *    REGIÃO (arredondada a ~1 km), por privacidade.
 *  • Sem permissão: usamos o centro de Franca como referência.
 */
export type StatusLocalizacao = "desconhecido" | "pedindo" | "ok" | "negado" | "indisponivel";

interface Localizacao {
  status: StatusLocalizacao;
  /** ponto usado para distâncias (GPS, última região conhecida ou centro de Franca) */
  ponto: Ponto;
  /** true quando o ponto veio do GPS (ou da última região do aparelho) */
  real: boolean;
  /** está fora de Franca e região? (só quando a localização é real) */
  foraDaArea: boolean;
  pedir: () => void;
}

const CHAVE = "frela-regiao";
const Ctx = createContext<Localizacao | null>(null);

const lerCache = (): Ponto | null => {
  try {
    const v = JSON.parse(localStorage.getItem(CHAVE) ?? "null");
    return v && Number.isFinite(v.lat) && Number.isFinite(v.lon) ? v : null;
  } catch {
    return null;
  }
};

export const LocalizacaoProvider = ({ children }: { children: ReactNode }) => {
  const { user, userTipo } = useAuth();
  const [status, setStatus] = useState<StatusLocalizacao>("desconhecido");
  const [ponto, setPonto] = useState<Ponto | null>(lerCache);
  const salvoNoPerfil = useRef(false);

  const pedir = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("indisponivel");
      return;
    }
    setStatus("pedindo");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setPonto(p);
        setStatus("ok");
        try {
          localStorage.setItem(CHAVE, JSON.stringify(arredondarRegiao(p)));
        } catch {
          /* sem storage */
        }
      },
      (err) => setStatus(err.code === err.PERMISSION_DENIED ? "negado" : "indisponivel"),
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 5 * 60 * 1000 },
    );
  }, []);

  // Ao abrir o app (profissional logado): pede a localização uma vez
  useEffect(() => {
    if (user && userTipo === "freelancer" && status === "desconhecido") pedir();
  }, [user, userTipo, status, pedir]);

  // Guarda a região (arredondada) no perfil, uma vez por sessão — SQL da Fase 8
  useEffect(() => {
    if (!user || status !== "ok" || !ponto || salvoNoPerfil.current) return;
    salvoNoPerfil.current = true;
    const r = arredondarRegiao(ponto);
    void supabase.from("profiles").update({ latitude: r.lat, longitude: r.lon, localizacao_em: new Date().toISOString() }).eq("id", user.id)
      .then(({ error }) => error && console.warn("Região não salva (rode o SQL da Fase 8)", error.message));
  }, [user, status, ponto]);

  const valor = useMemo<Localizacao>(() => {
    const real = !!ponto && status !== "negado";
    return { status, ponto: real && ponto ? ponto : FRANCA, real, foraDaArea: real && !!ponto && !dentroDaCobertura(ponto), pedir };
  }, [status, ponto, pedir]);

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
};

export const useLocalizacao = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useLocalizacao fora do LocalizacaoProvider");
  return v;
};
