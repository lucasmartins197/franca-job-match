import { useState } from "react";
import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { DbPortfolioFoto } from "@/hooks/usePerfil";

/** Galeria do portfólio com visualização em tela cheia. */
const PortfolioGallery = ({ fotos }: { fotos: DbPortfolioFoto[] }) => {
  const [aberta, setAberta] = useState<number | null>(null);

  if (fotos.length === 0) {
    return (
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <ImageIcon className="h-5 w-5" /> Ainda sem fotos de trabalhos.
      </div>
    );
  }

  const atual = aberta !== null ? fotos[aberta] : null;
  const mover = (delta: number) => setAberta((i) => (i === null ? null : (i + delta + fotos.length) % fotos.length));

  return (
    <>
      <div className="grid grid-cols-3 gap-1.5">
        {fotos.map((f, i) => (
          <button key={f.id} onClick={() => setAberta(i)} className="relative aspect-square rounded-xl overflow-hidden bg-muted group">
            <img src={f.url} alt={f.legenda ?? `Trabalho ${i + 1}`} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
          </button>
        ))}
      </div>
      <Dialog open={atual !== null} onOpenChange={(o) => !o && setAberta(null)}>
        <DialogContent className="p-0 bg-black border-0 max-w-lg overflow-hidden">
          <DialogTitle className="sr-only">Foto do portfólio</DialogTitle>
          {atual && (
            <div className="relative">
              <img src={atual.url} alt={atual.legenda ?? "Foto do portfólio"} className="w-full max-h-[80vh] object-contain" />
              {fotos.length > 1 && (
                <>
                  <button onClick={() => mover(-1)} aria-label="Anterior" className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button onClick={() => mover(1)} aria-label="Próxima" className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
              <p className="absolute bottom-2 inset-x-0 text-center text-xs text-white/80">{(aberta ?? 0) + 1} / {fotos.length}{atual.legenda ? ` · ${atual.legenda}` : ""}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PortfolioGallery;
