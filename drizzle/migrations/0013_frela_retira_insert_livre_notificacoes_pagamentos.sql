-- Fechamento de segurança: notificacoes e pagamentos só podem ser escritos
-- pelas funções internas (SECURITY DEFINER), nunca direto pelo app.
-- As duas políticas abaixo permitiam que QUALQUER usuário autenticado
-- inserisse notificações ou pagamentos falsos.

drop policy if exists "Usuario recebe notificacoes" on public.notificacoes;
drop policy if exists "Sistema registra pagamentos" on public.pagamentos;
