import { ReactNode } from "react";
import { CalendarDays, LocateFixed, Wallet } from "lucide-react";
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useFiltrosVagas, useVagasFiltradas } from "@/hooks/useVagas";
import { useLocalizacao } from "@/hooks/useLocalizacao";
import { CATEGORIAS } from "@/lib/categorias";
import { OPCOES_DATA, Ordem, RAIOS, VALORES_MIN } from "@/lib/filtrosVagas";
import { ICONE_PERIODO, Periodo } from "@/lib/vagas";
import { formatBRL } from "@/hooks/useFrela";
import { cn } from "@/lib/utils";

const Grupo = ({ titulo, icon: Icon, children, dica }: { titulo: string; icon?: typeof Wallet; children: ReactNode; dica?: string }) => (
  <section className="space-y-2.5">
    <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">{Icon && <Icon className="h-4 w-4 text-primary" />} {titulo}</h3>
    {children}
    {dica && <p className="text-xs text-muted-foreground">{dica}</p>}
  </section>
);

const Chip = ({ ativo, onClick, children, disabled }: { ativo: boolean; onClick: () => void; children: ReactNode; disabled?: boolean }) => (
  <button type="button" onClick={onClick} disabled={disabled} aria-pressed={ativo}
    className={cn("h-9 px-3.5 rounded-full text-sm font-medium border transition-colors disabled:opacity-40",
      ativo ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:border-primary/40")}>
    {children}
  </button>
);

const PERIODOS: Periodo[] = ["Manhã", "Tarde", "Noite", "Madrugada"];
const ORDENS: { id: Ordem; label: string }[] = [{ id: "distancia", label: "Mais perto" }, { id: "data", label: "Mais cedo" }, { id: "valor", label: "Maior valor" }];

/** Gaveta de filtros: tudo em toques (chips e blocos), com o total ao vivo. */
const FiltrosSheet = ({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) => {
  const { filtros: f, setFiltros, limpar } = useFiltrosVagas();
  const { lista } = useVagasFiltradas();
  const loc = useLocalizacao();
  const set = (patch: Partial<typeof f>) => setFiltros((a) => ({ ...a, ...patch }));

  return (
    <Drawer open={aberto} onOpenChange={(o) => !o && onFechar()} shouldScaleBackground={false}>
      <DrawerContent className="max-h-[88dvh] rounded-t-3xl">
        <DrawerHeader className="flex items-center justify-between pb-1">
          <DrawerTitle className="font-display text-xl">Filtros</DrawerTitle>
          <button onClick={limpar} className="text-sm font-semibold text-primary">Limpar</button>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-4 space-y-6">
          <Grupo titulo="Ordenar por">
            <div className="grid grid-cols-3 bg-muted rounded-xl p-1">
              {ORDENS.map((o) => (
                <button key={o.id} onClick={() => set({ ordem: o.id })} disabled={o.id === "distancia" && !loc.real}
                  className={cn("h-9 rounded-lg text-sm font-semibold disabled:opacity-40", f.ordem === o.id ? "bg-card shadow-card text-foreground" : "text-muted-foreground")}>
                  {o.label}
                </button>
              ))}
            </div>
          </Grupo>

          <Grupo titulo="Distância" icon={LocateFixed} dica={loc.real ? undefined : "Ative a localização para filtrar por distância."}>
            <div className="flex flex-wrap gap-2">
              <Chip ativo={f.raioKm == null} onClick={() => set({ raioKm: null })}>Qualquer</Chip>
              {RAIOS.map((r) => <Chip key={r} ativo={f.raioKm === r} disabled={!loc.real} onClick={() => set({ raioKm: r })}>até {r} km</Chip>)}
            </div>
            {!loc.real && <Button variant="outline" size="sm" onClick={loc.pedir} className="rounded-xl"><LocateFixed className="h-4 w-4 mr-1" /> Usar minha localização</Button>}
          </Grupo>

          <Grupo titulo="Quando" icon={CalendarDays}>
            <div className="flex flex-wrap gap-2">
              {OPCOES_DATA.map((o) => <Chip key={o.id} ativo={f.data === o.id} onClick={() => set({ data: o.id })}>{o.label}</Chip>)}
            </div>
          </Grupo>

          <Grupo titulo="Período">
            <div className="grid grid-cols-4 gap-2">
              {PERIODOS.map((p) => {
                const Icon = ICONE_PERIODO[p];
                const ativo = f.periodos.includes(p);
                return (
                  <button key={p} onClick={() => set({ periodos: ativo ? f.periodos.filter((x) => x !== p) : [...f.periodos, p] })} aria-pressed={ativo}
                    className={cn("rounded-2xl border py-3 flex flex-col items-center gap-1 text-xs font-semibold transition-colors",
                      ativo ? "bg-primary/10 border-primary text-primary" : "bg-card border-border text-muted-foreground")}>
                    <Icon className="h-5 w-5" /> {p}
                  </button>
                );
              })}
            </div>
          </Grupo>

          <Grupo titulo="Valor mínimo" icon={Wallet}>
            <div className="flex flex-wrap gap-2">
              <Chip ativo={f.valorMin == null} onClick={() => set({ valorMin: null })}>Qualquer</Chip>
              {VALORES_MIN.map((v) => <Chip key={v} ativo={f.valorMin === v} onClick={() => set({ valorMin: v })}>{formatBRL(v).replace(",00", "")}+</Chip>)}
            </div>
          </Grupo>

          <Grupo titulo="Categoria">
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIAS.map((c) => {
                const ativo = f.categoria === c.id;
                return (
                  <button key={c.id} onClick={() => set({ categoria: ativo ? null : c.id })} aria-pressed={ativo}
                    className={cn("rounded-2xl border p-2.5 flex flex-col items-center gap-1.5 text-[11px] font-semibold text-center transition-colors",
                      ativo ? "border-primary bg-primary/5 text-primary" : "border-border bg-card text-foreground")}>
                    <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center", c.cor)}><c.icon className="h-4 w-4" /></span>
                    {c.curto}
                  </button>
                );
              })}
            </div>
          </Grupo>
        </div>
        <DrawerFooter className="border-t border-border pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button onClick={onFechar} className="h-12 rounded-xl font-semibold text-base">
            Ver {lista.length} vaga{lista.length === 1 ? "" : "s"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default FiltrosSheet;
