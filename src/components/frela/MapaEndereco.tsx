import { ExternalLink, MapPin, Navigation } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Coordenadas, useCoordenadas } from "@/hooks/usePerfil";

interface Props {
  endereco?: string | null;
  cidade?: string | null;
  /** Coordenadas já salvas (empresa_dados.latitude/longitude) */
  coordenadas?: Coordenadas | null;
  className?: string;
}

/** Mapa OpenStreetMap (iframe, sem chave de API) com link para rota. */
const MapaEndereco = ({ endereco, cidade, coordenadas, className = "" }: Props) => {
  const { data: coords, isLoading } = useCoordenadas(endereco, cidade, coordenadas);
  const textoEndereco = [endereco, cidade ? `${cidade} - SP` : null].filter(Boolean).join(", ");
  const rota = coords
    ? `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lon}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(textoEndereco)}`;

  if (!endereco) return null;

  const d = 0.004;
  const src = coords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${coords.lon - d}%2C${coords.lat - d * 0.7}%2C${coords.lon + d}%2C${coords.lat + d * 0.7}&layer=mapnik&marker=${coords.lat}%2C${coords.lon}`
    : null;

  return (
    <div className={`rounded-2xl border border-border overflow-hidden bg-card ${className}`}>
      <div className="relative h-44 bg-muted">
        {isLoading ? (
          <Skeleton className="absolute inset-0 rounded-none" />
        ) : src ? (
          <iframe title={`Mapa: ${textoEndereco}`} src={src} className="absolute inset-0 w-full h-full border-0" loading="lazy" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground text-sm gap-1">
            <MapPin className="h-6 w-6" /> Não encontramos este endereço no mapa
          </div>
        )}
      </div>
      <div className="p-3 flex items-center gap-3">
        <MapPin className="h-4 w-4 text-primary shrink-0" />
        <p className="text-sm text-foreground flex-1 min-w-0">{textoEndereco}</p>
        <a href={rota} target="_blank" rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center gap-1 h-9 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-semibold">
          <Navigation className="h-3.5 w-3.5" /> Como chegar
        </a>
      </div>
      {coords && (
        <a href={`https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lon}#map=17/${coords.lat}/${coords.lon}`} target="_blank" rel="noopener noreferrer"
          className="block text-[11px] text-muted-foreground px-3 pb-2 -mt-1 hover:underline">
          Ver mapa ampliado <ExternalLink className="inline h-3 w-3" />
        </a>
      )}
    </div>
  );
};

export default MapaEndereco;
