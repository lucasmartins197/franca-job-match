/** Geolocalização: distâncias e área de cobertura do FreLa (Franca e região). */

export interface Ponto {
  lat: number;
  lon: number;
}

/** Centro de Franca/SP. */
export const FRANCA: Ponto = { lat: -20.5386, lon: -47.4009 };

/** Raio (km) a partir de Franca que o FreLa atende hoje ("Franca e região"). */
export const RAIO_COBERTURA_KM = 60;

/** Distância em km entre dois pontos (fórmula de haversine). */
export const distanciaKm = (a: Ponto, b: Ponto) => {
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
};

/** "850 m", "1,2 km", "15 km". */
export const formatDistancia = (km: number | null | undefined) => {
  if (km == null || !Number.isFinite(km)) return null;
  if (km < 1) return `${Math.max(50, Math.round((km * 1000) / 50) * 50)} m`;
  if (km < 10) return `${km.toFixed(1).replace(".", ",")} km`;
  return `${Math.round(km)} km`;
};

export const dentroDaCobertura = (p: Ponto) => distanciaKm(p, FRANCA) <= RAIO_COBERTURA_KM;

/** Arredonda para ~1 km: é o que guardamos do usuário (privacidade). */
export const arredondarRegiao = (p: Ponto): Ponto => ({ lat: Math.round(p.lat * 100) / 100, lon: Math.round(p.lon * 100) / 100 });
