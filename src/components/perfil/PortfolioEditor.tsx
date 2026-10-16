import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { MAX_PORTFOLIO, adicionarFotoPortfolio, removerFotoPortfolio, usePortfolio } from "@/hooks/usePerfil";

/** Upload múltiplo / remoção de fotos do portfólio (salva na hora). */
const PortfolioEditor = ({ userId }: { userId: string }) => {
  const { data: fotos = [] } = usePortfolio(userId);
  const queryClient = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(0);
  const [removendo, setRemovendo] = useState<string | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["portfolio", userId] });

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const espaco = MAX_PORTFOLIO - fotos.length;
    const lista = Array.from(files).slice(0, espaco);
    if (files.length > espaco) toast.info(`Máximo de ${MAX_PORTFOLIO} fotos no portfólio.`);
    setEnviando(lista.length);
    let ok = 0;
    for (const f of lista) {
      try {
        await adicionarFotoPortfolio(userId, f);
        ok++;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao enviar foto");
        break;
      } finally {
        setEnviando((n) => n - 1);
      }
    }
    setEnviando(0);
    if (input.current) input.current.value = "";
    if (ok) {
      toast.success(ok === 1 ? "Foto adicionada!" : `${ok} fotos adicionadas!`);
      refresh();
    }
  };

  const handleRemover = async (id: string) => {
    const foto = fotos.find((f) => f.id === id);
    if (!foto) return;
    setRemovendo(id);
    try {
      await removerFotoPortfolio(foto);
      refresh();
    } catch {
      toast.error("Erro ao remover");
    } finally {
      setRemovendo(null);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {fotos.map((f) => (
          <div key={f.id} className="relative aspect-square rounded-xl overflow-hidden bg-muted">
            <img src={f.url} alt="" className="w-full h-full object-cover" />
            <button type="button" onClick={() => handleRemover(f.id)} aria-label="Remover foto"
              className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center">
              {removendo === f.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
            </button>
          </div>
        ))}
        {Array.from({ length: enviando }, (_, i) => (
          <div key={`up-${i}`} className="aspect-square rounded-xl bg-muted flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ))}
        {fotos.length + enviando < MAX_PORTFOLIO && (
          <button type="button" onClick={() => input.current?.click()} disabled={enviando > 0}
            className="aspect-square rounded-xl border-2 border-dashed border-primary/40 text-primary flex flex-col items-center justify-center gap-1 text-xs font-semibold hover:bg-primary/5">
            <ImagePlus className="h-6 w-6" /> Adicionar
          </button>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-2">{fotos.length}/{MAX_PORTFOLIO} fotos · as fotos são salvas na hora.</p>
      <input ref={input} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
    </div>
  );
};

export default PortfolioEditor;
