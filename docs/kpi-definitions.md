# Définitions des 4 KPIs héros — Dashboard v2

Source de vérité : table `event_journal` (requête Supabase directe via l'adaptateur, pas de DataContext, pas de `farms`).

Périmètre appliqué à chaque KPI : `farm_id` du site sélectionné + fenêtre de dates (période sélectionnée). Si aucun site n'est sélectionné ("Tous les sites"), le périmètre couvre les `farm_id` distincts des sites chargés.

Règle absolue : aucune ligne source → `null` (état `no_data`), jamais `0` affiché.

## 1. Résultat net

- **Formule** : `Σ(amount | direction='entree') - Σ(amount | direction='sortie')` sur le périmètre site/période.
- **Unité** : FCFA (montants en `event_journal.amount`, devise `XOF`).
- **Source journal** : `event_type` ∈ {`recette`, `depense`} (déclenchés par `sales` et `expenses`).
- **État** :
  - aucune ligne → `no_data` (valeur `null`)
  - sinon → `ok`, valeur affichée avec signe (+ ou −)
- **Delta** : comparaison période précédente (même durée), affichée si disponible.
- **Lien** : page Finance.

## 2. Marge brute

- **Formule** : `(entrées - sorties) / entrées` sur le périmètre site/période.
- **Unité** : pourcentage (0–100).
- **Règle no_data** : si `entrées = 0` (ou aucune ligne) → `no_data` (jamais "0.0%" affiché à tort).
- **État** :
  - `entrées = 0` ou pas de ligne → `no_data` (valeur `null`)
  - sinon → `ok`
- **Lien** : page Finance.

## 3. Rendement (kg/ha)

- **Formule** : `Σ(quantité récoltée) / surface de la campagne active (ha)`.
- **Unité** : kg/ha.
- **Source journal** : `event_type` = `recolte` (déclenché par `harvests`).
- **Périmètre** : campagne active du site sélectionné (`status === 'en cours'`, sinon la plus récente par `year` desc).
- **Règle no_data** :
  - site = "Tous les sites" → `no_data` (rendement non applicable multi-sites)
  - pas de campagne active → `no_data`
  - pas de récolte sur la période → `no_data`
- **État** :
  - conditions ci-dessus → `no_data` (valeur `null`)
  - sinon → `ok`
- **Lien** : page Exploitation / Campagnes.

## 4. Alertes ouvertes

- **Formule** : `COUNT(*) WHERE status = 'ouverte'` des alertes du site (selon le même prédicat que la cloche/Sidebar — voir garde-fou B).
- **Unité** : nombre d'alertes.
- **Source** : table `alerts` (via DataContext), pas `event_journal`.
- **État** :
  - 0 → `ok` ("Aucune alerte ouverte")
  - ≥ 1 → `warn` (ou `crit` si sévérité `high` — seuil à valider par le responsable, défaut : pas de seuil, tout en `ok`/`warn`)
- **Lien** : page Surveillance / Alertes.

## Décisions ouvertes (choix par défaut consignés)

| Décision | Choix par défaut | Statut |
|----------|------------------|--------|
| Dépenses non imputées à une campagne incluses dans le résultat net | Oui, toutes les sorties du périmètre | à valider |
| Campagne active = `status === 'en cours'`, sinon la plus récente | Oui | à valider |
| Plusieurs campagnes actives → la plus récente | Oui | à valider |
| Seuils warn/crit pour les KPIs | Aucun défaut (tout en `ok`/`no_data`) | à valider par le responsable |
| Rendement multi-sites ("Tous les sites") | `no_data` | applicable |

**Prérequis Bloc 2** : remplacer l'adaptateur client (`clientDataSource`) par une RPC SQL côté Supabase. Pas de migration, pas de modification de schéma.