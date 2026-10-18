import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Logo from "@/components/frela/Logo";

/**
 * Destino do link "esqueci minha senha". O Supabase abre esta página já com uma
 * sessão de recuperação (evento PASSWORD_RECOVERY); aqui o usuário define a nova senha.
 * Configure a URL em Supabase → Auth → URL Configuration → Redirect URLs.
 */
const RedefinirSenha = () => {
  const navigate = useNavigate();
  const [pronto, setPronto] = useState<"carregando" | "ok" | "invalido">("carregando");
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (session && event === "SIGNED_IN")) setPronto("ok");
    });
    // se a sessão de recuperação já foi processada antes deste efeito
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) setPronto("ok");
    });
    const t = setTimeout(() => setPronto((p) => (p === "carregando" ? "invalido" : p)), 4000);
    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(t);
    };
  }, []);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (senha.length < 6) {
      toast.error("A senha precisa ter pelo menos 6 caracteres");
      return;
    }
    if (senha !== confirmacao) {
      toast.error("As senhas não conferem");
      return;
    }
    setSalvando(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setSalvando(false);
    if (error) {
      toast.error(error.message.toLowerCase().includes("different") ? "Use uma senha diferente da anterior" : "Não foi possível alterar a senha. Peça um novo link.");
      return;
    }
    toast.success("Senha alterada! Você já está conectado.");
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 pt-14 pb-8 max-w-md mx-auto">
      <div className="text-center mb-10"><Logo size="md" /></div>
      {pronto === "carregando" && <div className="flex justify-center pt-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
      {pronto === "invalido" && (
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4"><ShieldAlert className="h-8 w-8 text-destructive" /></div>
          <h1 className="text-xl font-display font-bold text-foreground mb-2">Link inválido ou expirado</h1>
          <p className="text-sm text-muted-foreground mb-6">Peça um novo link de recuperação na tela de login.</p>
          <Button onClick={() => navigate("/auth")} className="w-full h-12 rounded-xl">Ir para o login</Button>
        </div>
      )}
      {pronto === "ok" && (
        <form onSubmit={salvar}>
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4"><KeyRound className="h-8 w-8 text-primary" /></div>
          <h1 className="text-xl font-display font-bold text-foreground text-center mb-6">Crie uma nova senha</h1>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nova">Nova senha</Label>
              <Input id="nova" type="password" autoComplete="new-password" placeholder="Mínimo 6 caracteres" value={senha} onChange={(e) => setSenha(e.target.value)} className="h-12 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="conf">Confirme a nova senha</Label>
              <Input id="conf" type="password" autoComplete="new-password" value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} className="h-12 rounded-xl" />
            </div>
          </div>
          <Button type="submit" disabled={salvando} className="w-full h-12 mt-6 rounded-xl font-semibold text-base">
            {salvando ? <Loader2 className="h-5 w-5 animate-spin" /> : "Salvar nova senha"}
          </Button>
        </form>
      )}
    </div>
  );
};

export default RedefinirSenha;
