# Roadmap

## Now
- [ ] Backend connection decision (user): stay on the current Lovable Cloud database, or switch to the external project `modnamtaatcafqtjfzsd`. Switching needs a workspace admin (remove database, then connect) and would leave the rebuilt schema behind.
- [ ] Remove the throwaway test company accounts created while verifying flows (`empresa.pw.*`, `empresa-teste-abc123@test.com`) once the user agrees.

## Done
- [x] Backend schema reconstruction Fases 1-8 applied (drizzle/migrations 0000-0012); types regenerated.
- [x] Typecheck clean (`bunx tsgo --noEmit -p tsconfig.app.json`), latest build OK.
- [x] Security: dropped permissive INSERT policies on `notificacoes` and `pagamentos` (migration 0013). Verified by live test: direct inserts now rejected (403 RLS), own rows still readable, internal admin RPC still guards non-admins.
- [x] Signup flow verified end to end: company sign-up reaches `/dashboard` and the profile form; referral code assigned; login routes to `/completar-perfil` while the profile is incomplete.

## Blocked / waiting on user
- [ ] Profile photo upload: no storage bucket exists and the workspace blocks public buckets (`public_buckets_blocked`). User chose to leave this for later — until it is solved, sign-up cannot pass the mandatory photo step.
- [ ] Payment checkout function (provider, inputs, outputs still unspecified by user).
- [ ] Republish so the live site stops pointing at the stale backend address (needs user's go-ahead).
