import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { LEGAL } from "@/lib/legal";
import Logo from "@/components/frela/Logo";

const Topico = ({ titulo, children }: { titulo: string; children: React.ReactNode }) => (
  <section className="space-y-2">
    <h2 className="font-display font-bold text-foreground">{titulo}</h2>
    <div className="text-sm text-muted-foreground leading-relaxed space-y-2">{children}</div>
  </section>
);

const contato = (
  <>
    pelo app, em <b>Perfil → Falar com a equipe</b>
    {LEGAL.emailContato && <> ou pelo e-mail <a className="text-primary underline" href={`mailto:${LEGAL.emailContato}`}>{LEGAL.emailContato}</a></>}
  </>
);

const Pagina = ({ titulo, children }: { titulo: string; children: React.ReactNode }) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto px-5 pb-16">
      <header className="flex items-center gap-3 pt-6 pb-4">
        <button onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))} aria-label="Voltar"
          className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center"><ArrowLeft className="h-4 w-4" /></button>
        <Logo size="sm" />
      </header>
      <h1 className="text-2xl font-display font-bold text-foreground">{titulo}</h1>
      <p className="text-xs text-muted-foreground mt-1 mb-6">Atualizado em {LEGAL.atualizadoEm}</p>
      <div className="space-y-6">{children}</div>
    </div>
  );
};

/** Política de privacidade (LGPD) — rota pública /privacidade. */
export const Privacidade = () => (
  <Pagina titulo="Política de Privacidade">
    <Topico titulo="Quem somos">
      <p>
        O {LEGAL.empresa} conecta empresas de {LEGAL.cidade} a profissionais para trabalhos presenciais por turno.
        {LEGAL.controlador && <> O responsável pelos seus dados é {LEGAL.controlador}.</>}
      </p>
    </Topico>
    <Topico titulo="Dados que coletamos">
      <p><b>Cadastro:</b> nome, e-mail, telefone, cidade e foto. Empresas: nome da empresa, ramo, endereço e, se informado, CNPJ.</p>
      <p><b>Currículo do profissional:</b> profissões, experiência, sobre você, dias e períodos disponíveis, fotos do portfólio e redes sociais (opcionais).</p>
      <p><b>Uso do app:</b> vagas, candidaturas, contratações, valores declarados, códigos de confirmação, avaliações, mensagens do chat e do suporte.</p>
      <p>Não coletamos sua localização pelo GPS. O endereço da empresa é convertido em ponto no mapa (OpenStreetMap).</p>
    </Topico>
    <Topico titulo="Para que usamos">
      <p>Para mostrar vagas e currículos, avisar sobre vagas nos seus dias disponíveis, confirmar que o serviço aconteceu (código de confirmação), calcular a taxa de intermediação da empresa, manter avaliações e selos, prevenir fraudes e dar suporte.</p>
    </Topico>
    <Topico titulo="Quem vê seus dados">
      <p>Seu perfil público (nome, foto, profissões, avaliações, portfólio) é visto por usuários do app. Seu telefone só aparece para a outra parte depois de uma contratação confirmada. A equipe {LEGAL.empresa} acessa os dados para operação e suporte.</p>
      <p>Usamos o Supabase para hospedar o banco de dados e os arquivos. Não vendemos seus dados.</p>
    </Topico>
    <Topico titulo="Pagamentos">
      <p>Para o profissional o {LEGAL.empresa} é gratuito. A assinatura da empresa será cobrada pela App Store ou Google Play; os dados do cartão ficam com a loja, não conosco.</p>
    </Topico>
    <Topico titulo="Seus direitos (LGPD)">
      <p>Você pode acessar, corrigir e excluir seus dados. Para corrigir, use “Editar perfil”. Para excluir a conta, use <b>Perfil → Excluir minha conta</b> ou fale com a gente {contato}. A exclusão é concluída em até 7 dias; registros financeiros e de avaliações podem ser mantidos de forma anonimizada quando a lei exigir.</p>
    </Topico>
    <Topico titulo="Contato">
      <p>Dúvidas sobre privacidade: {contato}.</p>
    </Topico>
  </Pagina>
);

/** Termos de uso — rota pública /termos. */
export const Termos = () => (
  <Pagina titulo="Termos de Uso">
    <Topico titulo="O serviço">
      <p>O {LEGAL.empresa} aproxima empresas e profissionais autônomos. O {LEGAL.empresa} não é empregador nem parte do acordo de trabalho: valor, horário e condições são combinados entre empresa e profissional.</p>
    </Topico>
    <Topico titulo="Para profissionais">
      <p>Uso gratuito. Você se compromete a manter o currículo verdadeiro, comparecer aos serviços confirmados e digitar o código de confirmação que a empresa passar pessoalmente no local. Depois de cada serviço confirmado, avaliar a empresa é obrigatório para continuar se candidatando.</p>
    </Topico>
    <Topico titulo="Para empresas">
      <p>Assinatura mensal (quando ativada) e taxa de intermediação de 5% sobre o valor declarado de cada serviço confirmado pelo código. As taxas acumulam num saldo; ao atingir o limite, novas vagas ficam bloqueadas até a quitação. Avaliar o profissional após o serviço é obrigatório.</p>
    </Topico>
    <Topico titulo="Condutas proibidas">
      <p>Informações falsas, burlar o código de confirmação ou a taxa, assédio, discriminação e golpes. Contas que violarem estes termos podem ser suspensas. Denúncias: {contato}.</p>
    </Topico>
    <Topico titulo="Privacidade">
      <p>Veja a <a href="/privacidade" className="text-primary underline">Política de Privacidade</a>.</p>
    </Topico>
  </Pagina>
);
