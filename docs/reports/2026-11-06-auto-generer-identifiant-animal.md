# Auto-génération de l'identifiant animal (PREFIX-NNN par espèce)

Date : 2026-11-06 21:00
Branche : main
Commit : à venir
Auteur : Claude Code (agent) + validation humaine

## Contexte
Le champ Identificateur était saisi manuellement à la création d'animal, sans aucune génération automatique. Il fallait le pré-remplir avec un identifiant séquentiel PREFIX-NNN basé sur l'espèce (BOV-001, OVI-001, etc.) et le régénérer au changement d'espèce.

## Constats
- `src/pages/AnimalManage.tsx` : `identifier` requis dans zod (l.28), champ editable, pas de génération.
- `openCreate` (l.211) : sync, remettait `identifier` à `''`.
- Aucune génération existante dans le codebase.

## Actions effectuées

### Nouveau fichier : `src/lib/animal-ids.ts`
- `SPECIES_PREFIX` : cattle→BOV, sheep→OVI, goat→CAP, poultry→VOL, swine→POR, fallback→ANI.
- `getSpeciesPrefix(species)` : retourne le préfixe d'une espèce.
- `generateAnimalIdentifier(species, supabaseClient)` : interroge `animals` (ilike `prefix-%`, order desc, limit 1), incrémente le numéro, retourne `PREFIX-NNN` (zero-padded 3). Documente la race condition possible (pas de contrainte d'unicité DB).

### `src/pages/AnimalManage.tsx`
1. Import `generateAnimalIdentifier` depuis `@/lib/animal-ids`.
2. Champ Identificateur : `readOnly`, hint "Généré automatiquement", classe `bg-bg-input/50 cursor-not-allowed`.
3. FormSelect Espèce : `onChange` async qui régénère l'identifiant quand ce n'est pas une édition (`!editAnimal`).
4. `openCreate` : async, pré-génère l'identifiant pour `'cattle'` (espèce par défaut) au ouverture du modal.
5. `handleSubmit` : garde-fou — si `identifier` vide après trim, le génère avant l'insert. Utilise `finalIdentifier` dans le payload.
6. Appelants `openCreate` : `onClick={() => void openCreate()}` (async).

## Validation
- `npx tsc --noEmit` : exit 0 ✅
- `npm run build` : exit 0 ✅

## Comportement
- Ouverture "Nouvel animal" : identifiant pré-rempli (ex BOV-001).
- Changement d'espèce dans le modal : identifiant régénéré selon la nouvelle espèce.
- Édition d'un animal existant : identifier conservé (pas régénéré, champ readOnly).
- Soumission : identifiant utilisé tel quel, ou généré si vide (garde-fou).

## Limite connue
Pas de contrainte d'unicité DB sur `identifier` → race condition possible si deux créations simultanées pour la même espèce. Non bloquant pour cette mission.

## Décisions humaines requises
Aucune.

## Fichiers modifiés
- `src/lib/animal-ids.ts` (nouveau)
- `src/pages/AnimalManage.tsx`

## Prochaine étape
Commit atomique :
`feat(livestock): auto-generate animal identifier by species prefix`
