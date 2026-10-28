-- Migration 029 : Standardisation des statuts en français
-- Appliquée manuellement via Supabase Dashboard le 28/10/2026
-- Objectif : cohérence des filtres et KPIs dans toute l'application

-- Sites
UPDATE sites SET status = 'actif' WHERE status IN ('active', 'actived');
UPDATE sites SET status = 'inactif' WHERE status IN ('inactive', 'inactived');

-- Plots
UPDATE plots SET status = 'actif' WHERE status IN ('active');
UPDATE plots SET status = 'inactif' WHERE status IN ('inactive');
UPDATE plots SET status = 'repos' WHERE status IN ('resting', 'rest');

-- Campaigns
UPDATE campaigns SET status = 'récolté' WHERE status IN ('harvested', 'harvest', 'recolte');
UPDATE campaigns SET status = 'planifié' WHERE status IN ('planned', 'planifie');
UPDATE campaigns SET status = 'en cours' WHERE status IN ('in_progress', 'en_cours');
UPDATE campaigns SET status = 'terminé' WHERE status IN ('completed', 'done', 'termine');

-- Animals
UPDATE animals SET status = 'actif' WHERE status IN ('active');
UPDATE animals SET status = 'vendu' WHERE status IN ('sold', 'vende');
UPDATE animals SET status = 'mort' WHERE status IN ('deceased', 'dead');
UPDATE animals SET status = 'malade' WHERE status IN ('sick');

-- Projects (garde 'suspendu' qui est un statut métier valide)
UPDATE projects SET status = 'planifié' WHERE status IN ('planned', 'planifie');
UPDATE projects SET status = 'en cours' WHERE status IN ('in_progress', 'en_cours');
UPDATE projects SET status = 'terminé' WHERE status IN ('completed', 'done', 'termine');
UPDATE projects SET status = 'en retard' WHERE status IN ('late', 'delayed');

-- Expenses
UPDATE expenses SET status = 'validée' WHERE status IN ('validated', 'valide');
UPDATE expenses SET status = 'payée' WHERE status IN ('paid', 'paye');
UPDATE expenses SET status = 'en attente' WHERE status IN ('pending', 'en_attente');

-- Sales
UPDATE sales SET status = 'payée' WHERE status IN ('paid', 'paye');
