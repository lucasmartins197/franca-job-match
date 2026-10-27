import { Skeleton } from "@/components/ui/skeleton";

type Variante = "detalhe" | "perfil" | "lista" | "form" | "chat";

/** Esqueleto de página inteira (no lugar do spinner), no formato da tela que vai abrir. */
const PageSkeleton = ({ variante = "detalhe", comHeader = true }: { variante?: Variante; comHeader?: boolean }) => (
  <div className="min-h-screen bg-background max-w-lg mx-auto px-5" role="status" aria-label="Carregando">
    {comHeader && (
      <div className="flex items-center gap-3 pt-6 pb-5">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <Skeleton className="h-5 w-40" />
      </div>
    )}
    {variante === "perfil" && (
      <div className="space-y-4">
        <div className="rounded-3xl border border-border/70 bg-card p-5 flex flex-col items-center gap-3">
          <Skeleton className="h-24 w-24 rounded-3xl" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3.5 w-28" />
          <div className="grid grid-cols-3 gap-2 w-full mt-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
        </div>
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    )}
    {variante === "detalhe" && (
      <div className="space-y-4">
        <div className="rounded-3xl border border-border/70 bg-card p-5 space-y-3">
          <div className="flex gap-3"><Skeleton className="h-16 w-16 rounded-2xl" /><div className="flex-1 space-y-2"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" /></div></div>
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-4 w-2/3" /><Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-44 rounded-2xl" />
      </div>
    )}
    {variante === "lista" && <div className="space-y-3">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>}
    {variante === "form" && (
      <div className="space-y-4">
        <Skeleton className="h-24 w-24 rounded-3xl mx-auto" />
        {[0, 1, 2].map((i) => <div key={i} className="space-y-2"><Skeleton className="h-4 w-28" /><Skeleton className="h-11 rounded-xl" /></div>)}
      </div>
    )}
    {variante === "chat" && (
      <div className="space-y-3 pt-4">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className={`h-12 rounded-2xl ${i % 2 ? "w-2/3 ml-auto" : "w-3/4"}`} />)}
      </div>
    )}
  </div>
);

export default PageSkeleton;
