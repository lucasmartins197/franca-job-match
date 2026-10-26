/**
 * NOTIFICAÇÕES PUSH (nativas) — preparado, mas DESLIGADO.
 *
 * Hoje todas as notificações são internas: o banco grava em `notificacoes`
 * (triggers e funções do SQL) e o sino do app mostra em tempo real.
 * Para virar push no celular, nada muda nessas regras — só a ENTREGA:
 *
 * TODO (PUSH) quando publicar nas lojas:
 *  1. App: `npm i @capacitor/push-notifications` e `npx cap sync`.
 *     • Android: criar o projeto no Firebase, baixar google-services.json para
 *       android/app/ (sem ele o register() derruba o app no Android).
 *     • iOS: ligar "Push Notifications" no Xcode e subir a chave APNs no Firebase.
 *  2. Banco (SQL novo, ainda não criado):
 *       create table public.push_tokens (
 *         token text primary key, user_id uuid not null references auth.users on delete cascade,
 *         plataforma text not null, created_at timestamptz not null default now());
 *       + RLS: cada usuário insere/apaga só os próprios tokens.
 *  3. Edge Function `enviar-push` (service_role) acionada por um Database Webhook
 *     em INSERT de `notificacoes`: busca os tokens do user_id e envia via FCM
 *     (título "FreLa", corpo = notificacoes.texto, data.link = notificacoes.link).
 *  4. Chamar `registrarPush(userId)` depois do login (App.tsx) e, no clique da
 *     notificação, navegar para `data.link`.
 *
 * Tipos de notificação usados (notificacoes.tipo): candidatura, confirmacao,
 * mensagem, avaliacao, vaga_disponivel, codigo_gerado, digitar_codigo, avaliar,
 * taxa, divergencia, cancelamento, indicacao, suporte.
 */

/** Está rodando dentro do app nativo (Capacitor)? */
export const ehAppNativo = () =>
  typeof window !== "undefined" &&
  !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.();

/** Ponto único de registro do push. Hoje não faz nada (ver TODO acima). */
export const registrarPush = async (_userId: string): Promise<"desligado"> => "desligado";
