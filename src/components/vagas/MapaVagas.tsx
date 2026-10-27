import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { AnimatePresence, motion } from "framer-motion";
import { LocateFixed, MapPinOff, X } from "lucide-react";
import JobCard from "@/components/JobCard";
import type { DbProfile } from "@/hooks/useFrela";
import type { VagaLocalizada } from "@/lib/filtrosVagas";
import { FRANCA, Ponto } from "@/lib/geo";
import { cn } from "@/lib/utils";

interface Props {
  vagas: VagaLocalizada[];
  empresas: Record<string, DbProfile>;
  /** posição do usuário (só desenhada quando real) */
  usuario: Ponto | null;
  onPedirLocalizacao?: () => void;
  className?: string;
}

const valorCurto = (v: number) => `R$${Math.round(v)}`;

/** Vagas da mesma empresa/endereço ficam no mesmo ponto: espalha um pouco para todas aparecerem. */
const espalhar = (vagas: VagaLocalizada[]) => {
  const vistos = new Map<string, number>();
  return vagas.filter((v) => v.ponto).map((v) => {
    const chave = `${v.ponto!.lat.toFixed(4)},${v.ponto!.lon.toFixed(4)}`;
    const n = vistos.get(chave) ?? 0;
    vistos.set(chave, n + 1);
    const ang = n * 2.4;
    const r = n === 0 ? 0 : 0.00018 * Math.sqrt(n);
    return { v, pos: L.latLng(v.ponto!.lat + r * Math.sin(ang), v.ponto!.lon + r * Math.cos(ang)) };
  });
};

const iconeVaga = (valor: number, ativo: boolean, urgente: boolean) =>
  L.divIcon({
    className: "frela-pin",
    html: `<span class="frela-pin__corpo${ativo ? " frela-pin--ativo" : ""}${urgente ? " frela-pin--hoje" : ""}">${valorCurto(valor)}</span>`,
    iconSize: [64, 34],
    iconAnchor: [32, 34],
  });

const iconeUsuario = L.divIcon({ className: "frela-eu", html: '<span class="frela-eu__pulso"></span><span class="frela-eu__ponto"></span>', iconSize: [22, 22], iconAnchor: [11, 11] });

/** Mapa (Leaflet + OpenStreetMap) com um pin por vaga; tocar abre o resumo. */
const MapaVagas = ({ vagas, empresas, usuario, onPedirLocalizacao, className }: Props) => {
  const elRef = useRef<HTMLDivElement | null>(null);
  const mapaRef = useRef<L.Map | null>(null);
  const camadaRef = useRef<L.LayerGroup | null>(null);
  const enquadrarRef = useRef<() => void>(() => undefined);
  const mexeuRef = useRef(false);
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const pins = useMemo(() => espalhar(vagas), [vagas]);
  const semLocal = vagas.length - pins.length;
  const hoje = new Date().toISOString().slice(0, 10);

  // cria o mapa uma vez
  useEffect(() => {
    if (!elRef.current || mapaRef.current) return;
    const mapa = L.map(elRef.current, { zoomControl: false, attributionControl: true }).setView([FRANCA.lat, FRANCA.lon], 13);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(mapa);
    L.control.zoom({ position: "topright" }).addTo(mapa);
    mapa.on("click", () => setSelecionada(null));
    camadaRef.current = L.layerGroup().addTo(mapa);
    mapaRef.current = mapa;
    // o container pode mudar de tamanho depois de montar (transição, teclado, rotação)
    mapa.on("dragstart", () => (mexeuRef.current = true));
    const obs = new ResizeObserver(() => {
      mapa.invalidateSize();
      if (!mexeuRef.current) enquadrarRef.current();
    });
    obs.observe(elRef.current);
    return () => {
      obs.disconnect();
      mapa.remove();
      mapaRef.current = null;
    };
  }, []);

  // pins
  useEffect(() => {
    const camada = camadaRef.current;
    if (!camada) return;
    camada.clearLayers();
    for (const { v, pos } of pins) {
      L.marker(pos, { icon: iconeVaga(Number(v.job.payment), v.job.id === selecionada, v.job.date === hoje), title: v.job.title, zIndexOffset: v.job.id === selecionada ? 1000 : 0, keyboard: true })
        .on("click", (e) => {
          L.DomEvent.stopPropagation(e);
          setSelecionada(v.job.id);
          mapaRef.current?.panTo(pos, { animate: true });
        })
        .addTo(camada);
    }
    if (usuario) L.marker([usuario.lat, usuario.lon], { icon: iconeUsuario, interactive: false, zIndexOffset: -100 }).addTo(camada);
  }, [pins, usuario, selecionada, hoje]);

  // enquadra vagas + usuário quando a lista muda
  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa) return;
    const pontos = pins.map((p) => p.pos);
    if (usuario) pontos.push(L.latLng(usuario.lat, usuario.lon));
    enquadrarRef.current = () => {
      if (pontos.length === 0) return;
      // sem animação: o Leaflet ignora um novo enquadramento no meio de uma animação de zoom
      if (pontos.length === 1) mapa.setView(pontos[0], 15, { animate: false });
      else mapa.fitBounds(L.latLngBounds(pontos), { paddingTopLeft: [40, 70], paddingBottomRight: [40, 40], maxZoom: 15, animate: false });
    };
    mexeuRef.current = false;
    mapa.invalidateSize();
    enquadrarRef.current();
    // só quando muda o conjunto (não a seleção)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pins.map((p) => p.v.job.id).join(","), usuario?.lat, usuario?.lon]);

  const atual = vagas.find((v) => v.job.id === selecionada);

  return (
    <div className={cn("frela-mapa relative overflow-hidden rounded-3xl border border-border/70 shadow-card bg-muted isolate", className)}>
      <div ref={elRef} className="absolute inset-0" role="application" aria-label="Mapa de vagas" />

      <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 pointer-events-none z-[500]">
        <span className="pointer-events-auto px-3 py-1.5 rounded-full bg-card/95 backdrop-blur border border-border text-xs font-semibold shadow-card">
          {pins.length} vaga{pins.length === 1 ? "" : "s"} no mapa
        </span>
        {onPedirLocalizacao && (
          <button aria-label="Centralizar na minha localização"
            onClick={() => (usuario ? mapaRef.current?.setView([usuario.lat, usuario.lon], 15) : onPedirLocalizacao())}
            className="pointer-events-auto w-10 h-10 rounded-full bg-card/95 backdrop-blur border border-border shadow-card flex items-center justify-center">
            <LocateFixed className="h-4 w-4 text-primary" />
          </button>
        )}
      </div>

      {semLocal > 0 && !atual && (
        <p className="absolute bottom-3 left-3 z-[500] px-3 py-1.5 rounded-full bg-card/95 border border-border text-[11px] text-muted-foreground flex items-center gap-1 shadow-card">
          <MapPinOff className="h-3 w-3" /> {semLocal} sem endereço no mapa
        </p>
      )}

      <AnimatePresence>
        {atual && (
          <motion.div key={atual.job.id} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }} className="absolute left-3 right-3 bottom-3 z-[600]">
            <button onClick={() => setSelecionada(null)} aria-label="Fechar resumo"
              className="absolute -top-3 right-3 z-10 w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center shadow-card">
              <X className="h-3.5 w-3.5" />
            </button>
            <JobCard job={atual.job} empresa={empresas[atual.job.user_id]} distanciaKm={usuario ? atual.distanciaKm : null} compacto />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MapaVagas;
