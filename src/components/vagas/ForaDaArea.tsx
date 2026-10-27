import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, MapPinned } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Ponto, arredondarRegiao, cidadeDoPonto } from "@/lib/geo";

/**
 * Fora de Franca e região: tela amigável + lista de espera (SQL da Fase 8),
 * para sabermos onde há demanda.
 */
const ForaDaArea = ({ ponto, cidadePerfil, onContinuar }: { ponto: Ponto | null; cidadePerfil?: string | null; onContinuar: () => void }) => {
  const { user, userTipo } = useAuth();
  const [email, setEmail] = useState(user?.email ?? "");
  const [cidade, setCidade] = useState(cidadePerfil ?? "");
  const [enviando, setEnviando] = useState(false);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    if (!ponto) return;
    let vivo = true;
    void cidadeDoPonto(ponto).then((c) => vivo && c && setCidade(c));
    return () => {
      vivo = false;
    };
  }, [ponto]);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      toast.error("Digite um e-mail válido");
      return;
    }
    setEnviando(true);
    const regiao = ponto ? arredondarRegiao(ponto) : null;
    const { error } = await supabase.from("lista_espera").insert({
      email: email.trim().toLowerCase(), cidade: cidade.trim() || null, tipo: userTipo ?? null,
      latitude: regiao?.lat ?? null, longitude: regiao?.lon ?? null, user_id: user?.id ?? null,
    });
    setEnviando(false);
    if (error && error.code !== "23505") {
      toast.error(error.message.includes("lista_espera") ? "Lista de espera indisponível: rode o SQL da Fase 8." : "Não foi possível salvar. Tente de novo.");
      return;
    }
    setPronto(true);
  };

  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-border/70 bg-card shadow-card p-6 text-center">
      <div className="relative w-20 h-20 mx-auto mb-4">
        <span className="absolute inset-0 rounded-full bg-primary/10 animate-ping [animation-duration:2.4s]" />
        <span className="relative w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center"><MapPinned className="h-9 w-9 text-primary" /></span>
      </div>
      {pronto ? (
        <>
          <h2 className="text-xl font-display font-bold text-foreground flex items-center justify-center gap-2"><CheckCircle2 className="h-5 w-5 text-primary" /> Combinado!</h2>
          <p className="text-sm text-muted-foreground mt-2">Avisamos em <b>{email}</b> assim que o FreLa chegar{cidade ? <> em <b>{cidade}</b></> : " aí"}.</p>
        </>
      ) : (
        <>
          <h2 className="text-xl font-display font-bold text-foreground">O FreLa ainda não chegou na sua região</h2>
          <p className="text-sm text-muted-foreground mt-2">Por enquanto atendemos Franca e região. Deixe seu e-mail que avisamos quando chegarmos aí!</p>
          <form onSubmit={enviar} className="mt-5 space-y-3 text-left">
            <div className="space-y-1.5">
              <Label htmlFor="espera-email">E-mail</Label>
              <Input id="espera-email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="espera-cidade">Sua cidade</Label>
              <Input id="espera-cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Ex: Uberaba" className="h-11 rounded-xl" />
            </div>
            <Button type="submit" disabled={enviando} className="w-full h-12 rounded-xl font-semibold">
              {enviando ? <Loader2 className="h-5 w-5 animate-spin" /> : "Me avise quando chegar"}
            </Button>
          </form>
        </>
      )}
      <button onClick={onContinuar} className="mt-4 text-sm font-semibold text-primary">Ver as vagas de Franca mesmo assim</button>
    </motion.section>
  );
};

export default ForaDaArea;
