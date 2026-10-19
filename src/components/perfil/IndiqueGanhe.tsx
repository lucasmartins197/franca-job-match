import { useState } from "react";
import { Check, Copy, Gift, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/hooks/useFrela";
import { STATUS_INDICACAO, linkIndicacao, useCreditosTaxas, useMinhasIndicacoes } from "@/hooks/useIndicacoes";
import { RECOMPENSA_INDICACAO } from "@/lib/pagamentos";
import { cn } from "@/lib/utils";

/** Seção "Indique e Ganhe" no perfil da empresa. */
const IndiqueGanhe = ({ codigo, nomeEmpresa }: { codigo: string | null; nomeEmpresa: string }) => {
  const { data: indicacoes = [] } = useMinhasIndicacoes();
  const { data: creditos = [] } = useCreditosTaxas();
  const [copiado, setCopiado] = useState(false);

  if (!codigo) return null;
  const link = linkIndicacao(codigo);
  const ganhos = indicacoes.reduce((s, i) => s + (i.recompensa_valor ?? 0), 0);
  const disponivel = creditos.reduce((s, c) => s + c.saldo, 0);
  const mensagem = `A ${nomeEmpresa} usa o FreLa para contratar freelancers em Franca. Cadastre sua empresa com meu código ${codigo}: ${link}`;

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      toast.error("Não foi possível copiar. Copie o código manualmente.");
    }
  };

  const compartilhar = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "FreLa — Indique e Ganhe", text: mensagem, url: link });
        return;
      } catch {
        /* cancelado: cai no WhatsApp */
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(mensagem)}`, "_blank", "noopener");
  };

  return (
    <section className="bg-card border border-border rounded-2xl overflow-hidden shadow-card">
      <div className="bg-gradient-to-br from-primary to-brand-dim text-primary-foreground p-5">
        <div className="flex items-center gap-2 text-sm font-semibold opacity-90"><Gift className="h-4 w-4" /> Indique e Ganhe</div>
        <p className="text-xl font-display font-extrabold mt-1 leading-snug">Ganhe {formatBRL(RECOMPENSA_INDICACAO)} de desconto nas taxas por empresa indicada</p>
        <p className="text-sm opacity-90 mt-1">Quando a empresa que você indicou se cadastrar com seu código e ativar a assinatura, o desconto entra direto no seu saldo de taxas.</p>
        <div className="mt-4 rounded-xl bg-white/15 p-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase tracking-wide opacity-80">Seu código</p>
            <p className="text-2xl font-display font-extrabold tracking-[0.2em]">{codigo}</p>
          </div>
          <Button size="sm" variant="secondary" onClick={copiar} className="rounded-xl">
            {copiado ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />} Link
          </Button>
        </div>
        <Button onClick={compartilhar} className="w-full h-11 mt-3 rounded-xl bg-white text-primary hover:bg-white/90 font-semibold">
          <Share2 className="h-4 w-4 mr-2" /> Compartilhar convite
        </Button>
      </div>

      <div className="grid grid-cols-3 divide-x divide-border text-center border-b border-border">
        <div className="py-3"><p className="font-display font-bold text-foreground">{indicacoes.length}</p><p className="text-[11px] text-muted-foreground">Indicações</p></div>
        <div className="py-3"><p className="font-display font-bold text-emerald-700">{formatBRL(ganhos)}</p><p className="text-[11px] text-muted-foreground">Já ganhou</p></div>
        <div className="py-3"><p className="font-display font-bold text-foreground">{formatBRL(disponivel)}</p><p className="text-[11px] text-muted-foreground">Crédito disponível</p></div>
      </div>

      <div className="p-4">
        {indicacoes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">Nenhuma indicação ainda. Compartilhe seu código com outras empresas de Franca!</p>
        ) : (
          <ul className="space-y-2">
            {indicacoes.map((i) => {
              const st = STATUS_INDICACAO[i.status] ?? STATUS_INDICACAO.pendente;
              return (
                <li key={i.id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{i.indicado_nome || "Novo usuário"}</p>
                    <p className="text-xs text-muted-foreground">
                      {i.indicado_tipo === "empresa" ? "Empresa" : "Profissional"} · {new Date(i.created_at).toLocaleDateString("pt-BR")} · {st.descricao}
                      {i.indicado_tipo !== "empresa" && " (o desconto vale para empresas indicadas)"}
                    </p>
                  </div>
                  <span className={cn("shrink-0 px-2.5 py-1 rounded-md text-xs font-semibold", st.cls)}>
                    {i.status === "recompensado" && i.recompensa_valor ? `+${formatBRL(i.recompensa_valor)}` : st.label}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
};

export default IndiqueGanhe;
