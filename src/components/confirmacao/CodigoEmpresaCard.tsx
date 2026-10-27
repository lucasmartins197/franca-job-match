import { useNavigate } from "react-router-dom";
import { Headset, KeyRound, Loader2 } from "lucide-react";
import { DbContratacao, formatBRL } from "@/hooks/useFrela";
import { MAX_TENTATIVAS_CODIGO, useMeuCodigo } from "@/hooks/useConfirmacao";
import CodigoDigitos from "./CodigoDigitos";
import GerarCodigoButton from "./GerarCodigoButton";

/** Empresa: serviço em andamento. Sem código → "Serviço realizado"; com código → mostra o código. */
const CodigoEmpresaCard = ({ contratacao, profissionalNome }: { contratacao: DbContratacao; profissionalNome: string }) => {
  const navigate = useNavigate();
  const gerado = !!contratacao.codigo_gerado_em;
  const { data: codigo, isLoading } = useMeuCodigo(contratacao.id, gerado);
  const bloqueado = contratacao.codigo_tentativas >= MAX_TENTATIVAS_CODIGO;

  if (!gerado) {
    return (
      <section className="bg-card rounded-3xl p-4 border border-border/70 shadow-card space-y-3">
        <div className="flex gap-3">
          <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0"><KeyRound className="h-5 w-5" /></span>
          <div>
            <p className="font-display font-bold text-foreground">Confirmação do serviço</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Depois do serviço, toque em <b>Serviço realizado</b> e informe o valor pago. Você recebe um código de 4 dígitos para passar a {profissionalNome} pessoalmente.
            </p>
          </div>
        </div>
        <GerarCodigoButton contratacao={contratacao} className="w-full h-12" />
        <p className="text-xs text-muted-foreground text-center">Enquanto o serviço não for confirmado, não é possível criar novas vagas.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-4 space-y-3">
      <div className="text-center">
        <p className="font-display font-bold text-foreground">Código de confirmação</p>
        <p className="text-sm text-muted-foreground mt-0.5">
          Passe este código a {profissionalNome} <b>pessoalmente</b>. Ele digita no app para confirmar que esteve aí e recebeu {formatBRL(contratacao.valor)}.
        </p>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : bloqueado ? (
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 text-center">
          O código foi bloqueado depois de {MAX_TENTATIVAS_CODIGO} tentativas erradas. Gere um novo código.
        </p>
      ) : (
        <CodigoDigitos codigo={codigo} />
      )}
      {!bloqueado && contratacao.codigo_tentativas > 0 && (
        <p className="text-xs text-amber-800 text-center">{contratacao.codigo_tentativas} tentativa(s) errada(s) até agora.</p>
      )}
      <p className="text-xs text-muted-foreground text-center">Não envie pelo chat — o código prova que o serviço aconteceu.</p>
      <div className="flex flex-col sm:flex-row gap-2">
        <GerarCodigoButton contratacao={contratacao} variante="novo" className="flex-1 h-11" />
        <button onClick={() => navigate("/suporte")} className="flex-1 h-11 rounded-xl text-sm font-medium text-muted-foreground inline-flex items-center justify-center gap-1.5 hover:bg-muted">
          <Headset className="h-4 w-4" /> Profissional não consegue confirmar?
        </button>
      </div>
    </section>
  );
};

export default CodigoEmpresaCard;
