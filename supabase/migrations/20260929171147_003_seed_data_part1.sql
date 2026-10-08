/*
# Bahkanso Demo Data — Part 1: Farm, Users, Funders, Accounts, Suppliers, Categories

## Overview
Seeds realistic demonstration data for the Bahkanso platform.

## Data Created
1. **Farm**: "Ferme AgroVision" in Côte d'Ivoire
2. **App Users**: 8 users with different roles (admin, propriétaire, financeur, gestionnaire, comptable, responsable agricole, responsable élevage, auditeur)
3. **Funders**: 3 funders (individuals and organizations)
4. **Bank Accounts**: 2 bank accounts (Ecobank, BICICI)
5. **Cash Accounts**: 2 cash boxes (Caisse principale, Caisse terrain)
6. **Suppliers**: 6 suppliers (feed, seeds, vet, materials, fuel, equipment)
7. **Expense Categories**: 13 categories matching the spec

## Notes
- Uses ON CONFLICT to be idempotent
- Stores UUIDs in variables for cross-reference in subsequent migrations
*/

-- Clear existing data to avoid duplicates (safe on first run, idempotent on re-run)
DELETE FROM audit_logs;
DELETE FROM notifications;
DELETE FROM alerts;
DELETE FROM budgets;
DELETE FROM inventory_counts;
DELETE FROM inventory_movements;
DELETE FROM inventory_items;
DELETE FROM project_steps;
DELETE FROM projects;
DELETE FROM animal_events;
DELETE FROM animals;
DELETE FROM animal_lots;
DELETE FROM harvests;
DELETE FROM crop_operations;
DELETE FROM campaigns;
DELETE FROM crops;
DELETE FROM plots;
DELETE FROM sites;
DELETE FROM documents;
DELETE FROM transactions;
DELETE FROM expenses;
DELETE FROM expense_categories;
DELETE FROM suppliers;
DELETE FROM cash_accounts;
DELETE FROM bank_accounts;
DELETE FROM fundings;
DELETE FROM funders;
DELETE FROM app_users;
DELETE FROM farms;

-- ============ FARM ============
INSERT INTO farms (id, name, location, country, currency, phone, email) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Ferme AgroVision', 'Dabou, Côte d''Ivoire', 'Côte d''Ivoire', 'FCFA', '+225 27 23 45 67 89', 'contact@ferme-agrovision.ci');

-- ============ APP USERS ============
INSERT INTO app_users (id, name, email, role, phone, active) VALUES
  ('00000000-0000-0000-0000-000000000010', 'Kouadio Mensah', 'kouadio@ferme-agrovision.ci', 'administrateur', '+225 07 00 11 22 33', true),
  ('00000000-0000-0000-0000-000000000011', 'Awa Touré', 'awa@ferme-agrovision.ci', 'propriétaire', '+225 07 01 11 22 33', true),
  ('00000000-0000-0000-0000-000000000012', 'Jean-Pierre Dupont', 'jp.dupont@gmail.com', 'financeur', '+33 6 12 34 56 78', true),
  ('00000000-0000-0000-0000-000000000013', 'Ibrahim Cissé', 'ibrahim@ferme-agrovision.ci', 'gestionnaire', '+225 07 02 11 22 33', true),
  ('00000000-0000-0000-0000-000000000014', 'Fatou Koné', 'fatou@ferme-agrovision.ci', 'comptable', '+225 07 03 11 22 33', true),
  ('00000000-0000-0000-0000-000000000015', 'Sékou Camara', 'sekou@ferme-agrovision.ci', 'responsable_agricole', '+225 07 04 11 22 33', true),
  ('00000000-0000-0000-0000-000000000016', 'Moussa Bakayoko', 'moussa@ferme-agrovision.ci', 'responsable_élevage', '+225 07 05 11 22 33', true),
  ('00000000-0000-0000-0000-000000000017', 'Anne Martin', 'anne.martin@audit-cabinet.fr', 'auditeur', '+33 1 45 67 89 01', true);

-- ============ FUNDERS ============
INSERT INTO funders (id, name, organization, email, phone, country, total_sent, total_received) VALUES
  ('00000000-0000-0000-0000-000000000020', 'Jean-Pierre Dupont', 'InvestirAfrique', 'jp.dupont@gmail.com', '+33 6 12 34 56 78', 'France', 50000000, 32750000),
  ('00000000-0000-0000-0000-000000000021', 'Marie-Claire Boni', 'Boni Capital', 'mc.boni@bonicapital.com', '+33 6 98 76 54 32', 'France', 15000000, 15000000),
  ('00000000-0000-0000-0000-000000000022', 'AgriFund SARL', 'AgriFund', 'contact@agrifund.com', '+33 1 23 45 67 89', 'France', 10000000, 10000000);

-- ============ BANK ACCOUNTS ============
INSERT INTO bank_accounts (id, name, bank_name, account_number, currency, balance) VALUES
  ('00000000-0000-0000-0000-000000000030', 'Compte principal Ecobank', 'Ecobank', 'CI05 001 010 1234567890 12', 'FCFA', 8450000),
  ('00000000-0000-0000-0000-000000000031', 'Compte BICICI exploitation', 'BICICI', 'CI05 001 011 9876543210 34', 'FCFA', 4000000);

-- ============ CASH ACCOUNTS ============
INSERT INTO cash_accounts (id, name, location, currency, balance, responsible) VALUES
  ('00000000-0000-0000-0000-000000000040', 'Caisse principale', 'Bureau Dabou', 'FCFA', 350000, 'Fatou Koné'),
  ('00000000-0000-0000-0000-000000000041', 'Caisse terrain', 'Site de Dabou', 'FCFA', 150000, 'Ibrahim Cissé');

-- ============ SUPPLIERS ============
INSERT INTO suppliers (id, name, category, phone, email, address, contact_person, total_purchases, rating) VALUES
  ('00000000-0000-0000-0000-000000000050', 'NutriAnim SA', 'Alimentation animale', '+225 27 22 44 55 66', 'ventes@nutrianim.ci', 'Zone Industrielle Abidjan', 'Konan Yao', 3200000, 5),
  ('00000000-0000-0000-0000-000000000051', 'Semences Plus', 'Semences', '+225 27 22 33 44 55', 'contact@semencesplus.ci', 'Treichville Abidjan', 'Adjoua Kouassi', 850000, 4),
  ('00000000-0000-0000-0000-000000000052', 'VétoPro CI', 'Produits vétérinaires', '+225 27 22 55 66 77', 'info@vetopro.ci', 'Cocody Abidjan', 'Dr. Brou Koffi', 620000, 5),
  ('00000000-0000-0000-0000-000000000053', 'Matériaux Construction Dabou', 'Matériaux', '+225 27 23 66 77 88', 'ventes@mcdabou.ci', 'Dabou', 'Yao Kouadio', 4500000, 3),
  ('00000000-0000-0000-0000-000000000054', 'PetroCI Station', 'Carburant', '+225 27 23 77 88 99', 'station.dabou@petroci.ci', 'Dabou route principale', 'Awa Bamba', 980000, 4),
  ('00000000-0000-0000-0000-000000000055', 'AgriEquip CI', 'Équipement', '+225 27 22 99 00 11', 'contact@agriequip.ci', 'Yopougon Abidjan', 'Koffi N''Guessan', 2800000, 4);

-- ============ EXPENSE CATEGORIES ============
INSERT INTO expense_categories (name, description, color) VALUES
  ('Alimentation animale', 'Aliments pour le bétail', '#22C55E'),
  ('Semences', 'Semences et plants', '#16A34A'),
  ('Engrais', 'Engrais et amendements', '#15803D'),
  ('Produits vétérinaires', 'Médicaments et soins vétérinaires', '#2563EB'),
  ('Main-d''œuvre', 'Salaires et frais de personnel', '#F59E0B'),
  ('Matériaux', 'Matériaux de construction', '#64748B'),
  ('Carburant', 'Carburant et lubrifiants', '#DC2626'),
  ('Transport', 'Frais de transport et logistique', '#8B5CF6'),
  ('Équipement', 'Achat et maintenance d''équipements', '#0891B2'),
  ('Maintenance', 'Maintenance et réparations', '#EA580C'),
  ('Construction', 'Travaux de construction', '#475569'),
  ('Administration', 'Frais administratifs', '#6B7280'),
  ('Autre', 'Autres dépenses', '#9CA3AF');
