# Audit — Composant `RotatingCard` (cartes rotatives)

Date : 2026-11-06 08:31
Branche : main
Commit : c44726f (HEAD)
Auteur : Claude Code (agent)

## Contexte

Le composant `RotatingCard` (`src/components/ui/RotatingCard.tsx`) est une carte à retournement 3D (face avant / face arrière) utilisée dans plus de 30 call sites à travers le codebase (pages exploitation, configuration, finance, ventes, surveillance, modules Exploitation / Finance / Sales).

L'objectif de cet audit est de vérifier que le composant est production-ready : que ses props déclarées ont un effet réel, que l'accessibilité est préservée, et qu'aucune régression n'est introduite.

## Constats

### 1. Défaut confirmé : `flipLabel` et `backLabel` sont des props fantômes

Le composant déclare `flipLabel?: string` et `backLabel?: string` (RotatingCard.tsx:10-11) et les détruit en paramètres (RotatingCard.tsx:21-22), mais **ne les rend nulle part** dans le JSX retourné.

Or, 30+ call sites les passent explicitement, par exemple :
- `flipLabel="Détails" backLabel="Retour"` (AnimauxPage, RecoltesPage, LotCard, etc.)
- `flipLabel="Actions" backLabel="Retour"` (AnimalEventManage)
- `flipLabel={`Détail — ${event.label}`} backLabel="Retour"` (EvenementsTab, DocumentsTab, FundingsTab, ExpensesTab, TreasuryTab)

Les appelants s'attendent à ce que ces labels s'affichent (indice de retournement sur la face avant, libellé de retour sur la face arrière), mais ils sont silencieusement ignorés. C'est un défaut d'interface : le contrat du composant ment sur son comportement, ce qui est préjudiciable à l'accessibilité (ces labels auraient servi d'indice d'interaction) et à la cohérence de l'UI.

### 2. Lint

Avant correction : 2 erreurs `@typescript-eslint/no-unused-vars` sur `flipLabel` et `backLabel` (RotatingCard.tsx:21-22).

### 3. Tests

Avant correction : 4 tests, tous passants, mais aucun ne couvrait `flipLabel`/`backLabel`.

### 4. Accessibilité existante (non régressée)

- `role="button"`, `tabIndex={0}`, `aria-expanded={flipped}`, `aria-label` dynamique ("Ouvrir/Fermer les détails de X").
- Gestion clavier : Entrée/Espace basculent, Escape revient au recto.
- Pas de bascule au clic sur un élément interactif interne (bouton Modifier/Supprimer…), ni pendant une sélection de texte.
- `prefers-reduced-motion: reduce` désactive la transition.

## Analyse

Le défaut est circonscrit au composant `RotatingCard`. Aucun call site n'est à modifier : ils passent déjà `flipLabel`/`backLabel` et bénéficieront automatiquement de la correction.

Les labels doivent être rendus :
- `flipLabel` sur la face avant (à côté de l'icône de retournement, en haut à droite).
- `backLabel` sur la face arrière (en haut à droite).

## Actions effectuées

1. **`src/components/ui/RotatingCard.tsx`** :
   - `flipLabel` rendu dans un `<span className="rc-flip-label">` sur la face avant, à côté de l'icône `RotateCw`.
   - `backLabel` rendu dans un `<span className="rc-flip-label">` sur la face arrière, en haut à droite.
   - Les props restent optionnelles (pas de casse pour les call sites qui ne les passent pas).

2. **`src/components/ui/RotatingCard.css`** : ajout de la classe `.rc-flip-label` (ligne hauteur, pointer-events none).

3. **`src/components/ui/RotatingCard.test.tsx`** : ajout d'un test couvrant l'affichage de `flipLabel` sur la face avant et `backLabel` sur la face arrière (5 tests au total).

## Portes de validation

| Porte | Commande | Résultat |
|-------|----------|----------|
| Typecheck | `npx tsc --noEmit -p tsconfig.app.json` | PASS (exit 0) |
| Lint | `npx eslint src/components/ui/RotatingCard.tsx src/components/ui/RotatingCard.test.tsx` | PASS (exit 0) |
| Tests | `npx vitest run src/components/ui/RotatingCard.test.tsx` | 5/5 passés (exit 0) |
| Tests UI (régression) | `npx vitest run src/components/ui/` | 14/14 passés (exit 0) |

## Conclusion

**Le composant `RotatingCard` est maintenant production-ready.** Le défaut des props fantômes `flipLabel`/`backLabel` est corrigé : elles sont effectivement rendues. L'accessibilité est préservée, le typecheck est vert, le lint est propre, et aucun test n'est régressé.

## Décisions humaines requises

Aucune.

## Fichiers modifiés

- `src/components/ui/RotatingCard.tsx` (correction du rendu des labels)
- `src/components/ui/RotatingCard.css` (ajout `.rc-flip-label`)
- `src/components/ui/RotatingCard.test.tsx` (ajout test couverture labels)

## Prochaine étape

Aucune. Le composant est validé.
