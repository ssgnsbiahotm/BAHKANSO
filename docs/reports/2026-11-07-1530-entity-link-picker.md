# Phase B2 — EntityLinkPicker multi-entités + répartition

Date : 2026-11-07 15:30
Branche : main
Commit : 0540384
Auteur : Claude Code (agent) + validation humaine

## Contexte

Suite de Phase B1 (<EntityPicker> autocomplete 9 entités). Phase B2 crée
<EntityLinkPicker> : sélecteur multi-entités avec répartition du montant, pour
ExpensesTab, FundingsTab, RecoltesPage, SalesModule (Phase C).

## Constats

### FIX #0 — `customers` exposé dans DataContext (`src/lib/DataContext.tsx`)
- Import type `Customer` ajouté
- `DataContextType.customers: Customer[]` ajouté
- State `const [customers, setCustomers] = useState<Customer[]>([])` ajouté
- `safeRequest(supabase.from('customers')...)` ajouté dans `loadAll`
- `setCustomers(customersRes.data || [])` ajouté
- `customers,` ajouté à la valeur du Provider

### Composant créé : `src/components/ui/EntityLinkPicker.tsx` (~250 lignes)
API : `links`, `onChange`, `totalAmount`, `currency` (défaut XOF), `allowedTypes`, `disabled`, `className`.

Comportement :
- Header "Liens métier" + compteur (N liens · alloué / total FCFA)
- Tableau des liens : select type | EntityPicker | input montant | badge % | bouton ×
- Bouton "+ Ajouter un lien" (première allowedType, entity_id vide, montant 0)
- Footer : répartition cohérente (vert) / dépassement (rouge) / reste non alloué (orange)
- Empty state si 0 liens
- Warnings métier uniquement, pas de blocage de soumission
- Responsive : table sur desktop

### Test créé : `src/components/ui/EntityLinkPicker.test.tsx` (3 tests)
1. État vide : "Aucun lien" + bouton ajouter
2. Ajout de lien : clic ajouter → onChange reçoit 1 lien (entity_id vide, montant 0)
3. Suppression : clic × → onChange reçoit []

### Tests passent après ajustements
- Mock `lucide-react` avec `importOriginal` (icônes AlertCircle/CheckCircle2/PLus/X)
- Assertion "Aucun lien" via regex `/Aucun lien/i`
- `aria-label="Supprimer le lien"` ajouté au bouton × (cosmétique, pas de logique)

### Validation technique
```
set -o pipefail; npm run typecheck 2>&1 | tail -3; echo "TSC: $?"
→ TSC: 0
npx vitest run src/components/ui/EntityLinkPicker.test.tsx 2>&1 | tail -3; echo "TEST: $?"
→ TEST: 0 (3 tests passés)
set -o pipefail; npm run build 2>&1 | tail -3; echo "BUILD: $?"
→ BUILD: 0
```

## Conclusion

EntityLinkPicker créé, testé, typechecké, buildé. `customers` exposé dans
DataContext. Aucun nouveau package npm. EntityPicker.tsx non modifié.
Aucun formulaire existant modifié (intégration en Phase C).

## Décisions humaines requises

Aucune.

## Fichiers modifiés

- `src/lib/DataContext.tsx` (customers exposé)
- `src/components/ui/EntityLinkPicker.tsx` (créé)
- `src/components/ui/EntityLinkPicker.test.tsx` (créé)

## Prochaine étape

Intégrer EntityLinkPicker dans ExpensesTab, FundingsTab, RecoltesPage, SalesModule (Phase C).
