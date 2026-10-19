import { useState } from "react";
import { Award, BadgeCheck, Loader2, Sparkles, Target, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAjustarMeta, usePromover } from "@/hooks/useGestao";
import { META_TRABALHOS } from "@/hooks/usePerfil";
import { Secao } from "./Pecas";

export interface UsuarioPromover {
  id: string;
  nome: string;
  tipo: string;
  verificado: boolean;
  destaque: boolean;
  selos_extras: string[];
  meta_ajuste_trabalhos: number;
  trabalhos: number;
}

/** Promoção manual (selos/destaque) e ajuste da meta de trabalhos. */
const PromoverPainel = ({ usuario: u }: { usuario: UsuarioPromover }) => {
  const promover = usePromover();
  const ajustar = useAjustarMeta();
  const [ajuste, setAjuste] = useState(String(u.meta_ajuste_trabalhos ?? 0));
  const indicado = u.selos_extras.includes("indicado");

  const alterar = async (args: { verificado?: boolean; destaque?: boolean; selos?: string[] }, msg: string) => {
    try {
      await promover.mutateAsync({ id: u.id, ...args });
      toast.success(msg);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    }
  };

  const salvarAjuste = async () => {
    try {
      await ajustar.mutateAsync({ id: u.id, ajuste: Math.round(Number(ajuste) || 0) });
      toast.success("Meta ajustada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao ajustar");
    }
  };

  const total = u.trabalhos + (u.meta_ajuste_trabalhos ?? 0);
  const itens = [
    { id: "verificado", icon: BadgeCheck, titulo: "Verificado", desc: "Identidade/empresa conferida pela equipe", ativo: u.verificado,
      onChange: (v: boolean) => alterar({ verificado: v }, v ? "Selo Verificado concedido" : "Selo Verificado removido") },
    { id: "destaque", icon: Sparkles, titulo: "Destaque", desc: "Selo de destaque no perfil", ativo: u.destaque,
      onChange: (v: boolean) => alterar({ destaque: v }, v ? "Destaque ativado" : "Destaque removido") },
    { id: "indicado", icon: ThumbsUp, titulo: "Indicado pela FreLa", desc: "Recomendação da equipe", ativo: indicado,
      onChange: (v: boolean) => alterar({ selos: v ? [...u.selos_extras.filter((s) => s !== "indicado"), "indicado"] : u.selos_extras.filter((s) => s !== "indicado") },
        v ? "Selo Indicado concedido" : "Selo Indicado removido") },
  ];

  return (
    <Secao titulo="Promoção e metas" direita={promover.isPending && <Loader2 className="h-4 w-4 animate-spin text-primary" />}>
      <div className="grid sm:grid-cols-3 gap-2">
        {itens.map((i) => (
          <label key={i.id} className="flex items-start gap-3 rounded-xl border border-border p-3 cursor-pointer">
            <i.icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <span className="flex-1">
              <span className="block text-sm font-semibold text-foreground">{i.titulo}</span>
              <span className="block text-xs text-muted-foreground">{i.desc}</span>
            </span>
            <Switch checked={i.ativo} onCheckedChange={i.onChange} disabled={promover.isPending} />
          </label>
        ))}
      </div>
      {u.tipo === "freelancer" && (
        <div className="mt-4 rounded-xl border border-border p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Target className="h-4 w-4 text-primary" /> Meta: selo "Experiente" ({META_TRABALHOS} trabalhos)
            {total >= META_TRABALHOS && <span className="inline-flex items-center gap-1 text-xs text-emerald-700"><Award className="h-3.5 w-3.5" /> atingida</span>}
          </div>
          <Progress value={Math.min(100, (total / META_TRABALHOS) * 100)} className="h-2 mt-2" />
          <p className="text-xs text-muted-foreground mt-1">{u.trabalhos} trabalhos pelo FreLa {u.meta_ajuste_trabalhos ? `+ ${u.meta_ajuste_trabalhos} de ajuste` : ""} = {total}/{META_TRABALHOS}</p>
          <div className="flex items-center gap-2 mt-2">
            <Input type="number" value={ajuste} onChange={(e) => setAjuste(e.target.value)} className="h-9 w-24 rounded-lg" aria-label="Ajuste manual de trabalhos" />
            <Button size="sm" variant="outline" onClick={salvarAjuste} disabled={ajustar.isPending} className="rounded-lg">Salvar ajuste</Button>
            <span className="text-[11px] text-muted-foreground">Ex.: trabalhos comprovados fora do app.</span>
          </div>
        </div>
      )}
    </Secao>
  );
};

export default PromoverPainel;
