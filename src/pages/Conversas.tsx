import PageHeader from "@/components/frela/PageHeader";
import ConversasList from "@/components/chat/ConversasList";

/** Lista de conversas em tela cheia (usada pela empresa, que não tem barra inferior). */
const Conversas = () => (
  <div className="min-h-screen bg-background max-w-lg mx-auto pb-12">
    <PageHeader title="Conversas" />
    <div className="px-5">
      <ConversasList />
    </div>
  </div>
);

export default Conversas;
