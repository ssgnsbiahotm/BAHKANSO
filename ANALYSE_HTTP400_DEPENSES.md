# ANALYSE DES ERREURS HTTP 400 SUR LES DÉPENSES

## Requête problématique identifiée

La requête Supabase générant des erreurs HTTP 400 répétés se trouve dans `/src/lib/DataContext.tsx` à la ligne 109 :

```typescript
supabase.from("expenses").select("*, supplier:suppliers(*), funding:fundings(funder:funders(*))").order("date", { ascending: false })
```

## Structure de la requête

Cette requête effectue des jointures imbriquées complexes :
1. Niveau 1 : `expenses` → `supplier` (via `supplier_id`) → sélection de toutes les colonnes de `suppliers`
2. Niveau 2 : `expenses` → `funding` (via `funding_id`) → `funder` (via `funder_id` dans `fundings`) → sélection de toutes les colonnes de `funders`
3. Ordre décroissant par la colonne `date`

## Preuves dans le codebase

- Cette requête est unique dans l'application (apparait seulement une fois)
- D'autres requêtes avec jointures imbriquées existent mais sont moins complexes :
  - `fundings`: `*, funder:funders(*)` (1 niveau)
  - `campaigns`: `*, plot:plots(*)` (1 niveau)
  - `inventory_movements`: `*, item:inventory_items(*)` (1 niveau)
  - `inventory_counts`: `*, item:inventory_items(*)` (1 niveau)

## Types TypeScript correspondants

Les types définis dans `/src/lib/types.ts` supportent cette structure :
- `Expense` contient `funding_id: string | null` et `funder?: Funder | null`
- `Funding` contient `funder_id: string | null` et `funder?: Funder | null`

## Hypothèses sur l'origine des erreurs HTTP 400

1. **Limite de complexité de Supabase** : La jointure imbriquée à deux niveaux pourrait dépasser les limitations de Supabase
2. **Problème de syntaxe** : La syntaxe exacte pourrait ne pas être supportée par l'API REST de Supabase
3. **Timeout ou limites de taille** : Le résultat pourrait être trop gros ou prendre trop de temps
4. **Permissions RLS** : Les politiques de sécurité au niveau ligne pourraient bloquer l'accès aux relations imbriquées

## Prochaines étapes recommandées (requièrent accord)

Pour diagnostiquer précisément l'erreur, il faudrait :
1. Activer le logging détaillé des réponses Supabase pour capturer le code, message, details et hint de l'erreur HTTP 400
2. Tester des versions simplifiées de la requête pour isoler le problème :
   - Sans les jointures imbriquées
   - Avec seulement un niveau d'imbrication
   - Avec une jointure à deux niveaux mais moins de colonnes
3. Vérifier les politiques RLS (Row Level Security) sur les tables concernées
4. Examiner si des mécanismes de retry ou de refetch causent la répétition de l'erreur

## Contraintes respectées

Cette analyse s'est faite exclusivement par lecture de code existant, sans :
- Modification du code applicatif
- Exécution de requêtes réseau réelles
- Déclenchement d'effets de bord
- Accès aux données de production