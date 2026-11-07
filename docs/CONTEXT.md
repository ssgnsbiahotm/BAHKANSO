# Contexte du projet BAHKANSO — Point de reprise

**Date de mise à jour** : 2026-11-07
**Branche de référence** : `main`
**Dernier commit** : `b93b66b` (fix(db): make surveillance_events references idempotent)
**URL production** : https://bahkanso.surge.sh

## Ce qui a été fait (résumé)

1. **Sécurité RLS** : Politiques least-privilege sur `fundings`, `expenses`, `sales`, `app_users`, `funders`.
   - `FORCE ROW LEVEL SECURITY` activé.
   - Helpers `current_*` (SECURITY DEFINER + `row_security = off`).
   - Tests d'intégration avec vrai JWT.

2. **Journal d'Événements** :
   - Table `event_journal` (immuable).
   - Triggers sur `expenses`, `harvests`, `sales`, `animal_events`, `tasks`.
   - Traçabilité complète.

3. **KPIs** (7 au total) :
   - Rendement (kg/ha)
   - Avancement chantier (%)
   - Marge brute (XOF)
   - Coût de revient (XOF/unité)
   - Taux de mortalité (%)
   - GMQ (g/jour)
   - Marge par culture (XOF)

4. **Tests** :
   - 86/86 tests unitaires (Vitest, fork isolation).
   - 3 tests RLS sales.
   - Tests d'intégration RLS (pgTAP + vitest).

5. **Infrastructure** :
   - `supabase db reset` 100% reproductible.
   - Déploiement Surge (`npx surge dist/ bahkanso.surge.sh`).

## Ce qui reste à faire (P1/P2)

- [ ] Ajouter `RequireModule(action='write')` sur les onglets fundings/expenses.
- [ ] Créer `.env.example`.
- [ ] Corriger les 23 warnings ESLint (non bloquants).
- [ ] Polish UX D1/D2 (formulaires financiers).
- [ ] Ajouter des KPIs (trésorerie, graphiques).

## Commandes utiles

```bash
# Redémarrer l'environnement
supabase stop --no-backup
supabase start
supabase db reset

# Lancer les tests
npm run typecheck
npm run lint
npx vitest run src/

# Build et déployer
npm run build
npx surge dist/ bahkanso.surge.sh
```