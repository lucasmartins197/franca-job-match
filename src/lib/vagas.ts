import { Moon, Sun, Sunrise, Sunset, LucideIcon } from "lucide-react";

export type Periodo = "Manhã" | "Tarde" | "Noite" | "Madrugada";

/** Período do dia de um horário "HH:MM" (mesma regra de frela_periodo no SQL). */
export const periodoDe = (hora?: string | null): Periodo | null => {
  const h = Number((hora ?? "").split(":")[0]);
  if (!hora || !Number.isFinite(h)) return null;
  if (h < 5) return "Madrugada";
  if (h < 12) return "Manhã";
  if (h < 18) return "Tarde";
  return "Noite";
};

export const ICONE_PERIODO: Record<Periodo, LucideIcon> = { Madrugada: Moon, Manhã: Sunrise, Tarde: Sun, Noite: Sunset };

/** Dias entre hoje e a data (0 = hoje). */
export const diasAte = (date: string, hoje = new Date()) => {
  const d = new Date(`${date}T12:00:00`);
  const h = new Date(hoje);
  h.setHours(12, 0, 0, 0);
  return Math.round((d.getTime() - h.getTime()) / 86_400_000);
};

/** "Hoje", "Amanhã" ou "sex, 24/10". */
export const dataAmigavel = (date: string) => {
  const diff = diasAte(date);
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Amanhã";
  return new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" }).replace(".", "");
};

/** Publicada nas últimas 24 h. */
export const ehNova = (createdAt?: string | null) => !!createdAt && Date.now() - new Date(createdAt).getTime() < 86_400_000;
