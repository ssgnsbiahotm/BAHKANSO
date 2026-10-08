/*
# Bahkanso Demo Data — Part 2: Fundings, Sites, Plots, Campaigns, Animals, Projects, Inventory

## Overview
Seeds operational demonstration data.

## Data Created
1. **Fundings**: 5 funding records with different statuses (reçu, envoyé, en transit, prévu)
2. **Sites**: 1 site (Site de Dabou)
3. **Plots**: 3 plots (P-01 Maïs 5ha, P-02 Soja 8ha, P-03 Manioc 4ha)
4. **Campaigns**: 3 campaigns (2026 season for each plot)
5. **Crops**: 3 crop types (Maïs, Soja, Manioc)
6. **Crop Operations**: 6 operations across campaigns
7. **Harvests**: 1 completed harvest
8. **Animal Lots**: 3 lots (bovins, poulets, chèvres)
9. **Animals**: 5 individual tracked animals
10. **Animal Events**: 8 events (vaccinations, traitements, naissances, pesées)
11. **Projects**: 3 projects (Forage, Hangar, Clôture) with different progress
12. **Project Steps**: 9 steps (3 per project)
13. **Inventory Items**: 7 items (ciment, aliments, semences, engrais, carburant, vet, outils)
14. **Inventory Movements**: 10 movements
15. **Inventory Counts**: 1 count with anomaly
16. **Budgets**: 5 budget records
*/

-- ============ FUNDINGS ============
INSERT INTO fundings (id, reference, funder_id, amount_sent, currency_sent, exchange_rate, amount_received, transfer_fees, date_sent, date_received, destination_account_id, bank_reference, status, comment, created_by) VALUES
  ('00000000-0000-0000-0000-000000000060', 'FND-2025-001', '00000000-0000-0000-0000-000000000020', 10000, 'EUR', 655.95, 6559500, 40500, '2025-01-15', '2025-01-18', '00000000-0000-0000-0000-000000000030', 'ECO-2025-001-8842', 'reçu', 'Premier financement pour démarrage exploitation', '00000000-0000-0000-0000-000000000010'),
  ('00000000-0000-0000-0000-000000000061', 'FND-2025-002', '00000000-0000-0000-0000-000000000020', 15000, 'EUR', 655.95, 9839250, 150000, '2025-03-20', '2025-03-25', '00000000-0000-0000-0000-000000000030', 'ECO-2025-002-9921', 'reçu', 'Financement forage et irrigation', '00000000-0000-0000-0000-000000000010'),
  ('00000000-0000-0000-0000-000000000062', 'FND-2025-003', '00000000-0000-0000-0000-000000000021', 15000, 'EUR', 655.95, 9839250, 150000, '2025-06-10', '2025-06-14', '00000000-0000-0000-0000-000000000031', 'BIC-2025-003-4477', 'reçu', 'Financement hangar d''élevage', '00000000-0000-0000-0000-000000000010'),
  ('00000000-0000-0000-0000-000000000063', 'FND-2026-001', '00000000-0000-0000-0000-000000000020', 5000, 'EUR', 655.95, 3279750, 50250, '2026-01-10', '2026-01-14', '00000000-0000-0000-0000-000000000030', 'ECO-2026-001-5530', 'reçu', 'Financement campagne 2026', '00000000-0000-0000-0000-000000000010'),
  ('00000000-0000-0000-0000-000000000064', 'FND-2026-002', '00000000-0000-0000-0000-000000000022', 10000, 'EUR', 655.95, null, null, '2026-09-25', null, null, null, 'en transit', 'Financement Q4 2026 en cours de transfert', '00000000-0000-0000-0000-000000000010');

-- ============ SITES ============
INSERT INTO sites (id, name, location, area_hectares, responsible) VALUES
  ('00000000-0000-0000-0000-000000000070', 'Site de Dabou', 'Dabou, 50km Abidjan', 30, 'Sékou Camara');

-- ============ PLOTS ============
INSERT INTO plots (id, reference, name, site_id, area_hectares, location, soil_type, status, current_crop) VALUES
  ('00000000-0000-0000-0000-000000000080', 'P-01', 'Parcelle P-01 — Maïs', '00000000-0000-0000-0000-000000000070', 5, 'Dabou nord', 'Sableux', 'actif', 'Maïs'),
  ('00000000-0000-0000-0000-000000000081', 'P-02', 'Parcelle P-02 — Soja', '00000000-0000-0000-0000-000000000070', 8, 'Dabou centre', 'Argileux', 'actif', 'Soja'),
  ('00000000-0000-0000-0000-000000000082', 'P-03', 'Parcelle P-03 — Manioc', '00000000-0000-0000-0000-000000000070', 4, 'Dabou sud', 'Sablo-argileux', 'actif', 'Manioc');

-- ============ CROPS ============
INSERT INTO crops (id, name, variety, season, growing_cycle_days) VALUES
  ('00000000-0000-0000-0000-000000000090', 'Maïs', 'Obatampa', 'Pluies', 90),
  ('00000000-0000-0000-0000-000000000091', 'Soja', 'TGX 1448-2E', 'Pluies', 105),
  ('00000000-0000-0000-0000-000000000092', 'Manioc', 'Bocou 1', 'Toutes saisons', 365);

-- ============ CAMPAIGNS ============
INSERT INTO campaigns (id, year, plot_id, crop_name, start_date, expected_harvest_date, budget, responsible, status) VALUES
  ('00000000-0000-0000-0000-0000000000a0', 2026, '00000000-0000-0000-0000-000000000080', 'Maïs', '2026-03-01', '2026-06-15', 1200000, 'Sékou Camara', 'en cours'),
  ('00000000-0000-0000-0000-0000000000a1', 2026, '00000000-0000-0000-0000-000000000081', 'Soja', '2026-03-15', '2026-07-01', 1800000, 'Sékou Camara', 'en cours'),
  ('00000000-0000-0000-0000-0000000000a2', 2026, '00000000-0000-0000-0000-000000000082', 'Manioc', '2026-04-01', '2027-04-01', 800000, 'Sékou Camara', 'en cours');

-- ============ CROP OPERATIONS ============
INSERT INTO crop_operations (id, campaign_id, plot_id, type, date, responsible, cost, labor_cost, inputs, quantity, unit, comment) VALUES
  ('00000000-0000-0000-0000-0000000000b0', '00000000-0000-0000-0000-0000000000a0', '00000000-0000-0000-0000-000000000080', 'préparation', '2026-03-01', 'Sékou Camara', 150000, 100000, 'Herbicide Glyphosate', 5, 'litres', 'Défrichage et préparation du sol'),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a0', '00000000-0000-0000-0000-000000000080', 'semis', '2026-03-10', 'Sékou Camara', 350000, 80000, 'Semences Obatampa 25kg', 25, 'kg', 'Semis manuel en lignes'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000a0', '00000000-0000-0000-0000-000000000080', 'fertilisation', '2026-04-05', 'Sékou Camara', 280000, 60000, 'NPK 15-15-15', 300, 'kg', 'Première application d''engrais'),
  ('00000000-0000-0000-0000-0000000000b3', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000081', 'préparation', '2026-03-15', 'Sékou Camara', 200000, 120000, 'Herbicide', 8, 'litres', 'Préparation parcelle soja'),
  ('00000000-0000-0000-0000-0000000000b4', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000081', 'semis', '2026-03-25', 'Sékou Camara', 420000, 100000, 'Semences TGX 1448-2E 40kg', 40, 'kg', 'Semis soja'),
  ('00000000-0000-0000-0000-0000000000b5', '00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-000000000082', 'plantation', '2026-04-01', 'Sékou Camara', 180000, 150000, 'Boutures manioc', 2000, 'boutures', 'Plantation boutures manioc');

-- ============ HARVESTS ============
INSERT INTO harvests (id, campaign_id, plot_id, date, quantity, unit, quality, estimated_price, revenue, destination) VALUES
  ('00000000-0000-0000-0000-0000000000c0', '00000000-0000-0000-0000-0000000000a0', '00000000-0000-0000-0000-000000000080', '2026-06-20', 8500, 'kg', 'bonne', 250, 2125000, 'Vente marché Dabou');

-- ============ ANIMAL LOTS ============
INSERT INTO animal_lots (id, identifier, species, breed, count, location, status, estimated_value) VALUES
  ('00000000-0000-0000-0000-0000000000d0', 'LOT-BOV-01', 'Bovin', 'N''dama', 35, 'Pâturage nord', 'actif', 3500000),
  ('00000000-0000-0000-0000-0000000000d1', 'LOT-VOL-01', 'Volaille', 'Poulet de chair', 80, 'Poulailler A', 'actif', 240000),
  ('00000000-0000-0000-0000-0000000000d2', 'LOT-CAP-01', 'Caprin', 'Chèvre sahélienne', 24, 'Enclos sud', 'actif', 720000);

-- ============ ANIMALS (individual tracking for high-value) ============
INSERT INTO animals (id, identifier, species, breed, sex, birth_date, origin, acquisition_date, acquisition_value, weight_kg, lot_id, location, status, estimated_value) VALUES
  ('00000000-0000-0000-0000-0000000000e0', 'BOV-001', 'Bovin', 'N''dama', 'M', '2022-03-15', 'Ferme Bouaké', '2022-06-01', 180000, 320, '00000000-0000-0000-0000-0000000000d0', 'Pâturage nord', 'actif', 250000),
  ('00000000-0000-0000-0000-0000000000e1', 'BOV-002', 'Bovin', 'N''dama', 'F', '2021-01-20', 'Ferme Bouaké', '2021-03-10', 200000, 380, '00000000-0000-0000-0000-0000000000d0', 'Pâturage nord', 'actif', 280000),
  ('00000000-0000-0000-0000-0000000000e2', 'BOV-003', 'Bovin', 'N''dama', 'M', '2023-05-10', 'Naissance ferme', '2023-05-10', 0, 145, '00000000-0000-0000-0000-0000000000d0', 'Pâturage nord', 'actif', 120000),
  ('00000000-0000-0000-0000-0000000000e3', 'BOV-004', 'Bovin', 'N''dama', 'F', '2023-08-22', 'Naissance ferme', '2023-08-22', 0, 110, '00000000-0000-0000-0000-0000000000d0', 'Pâturage nord', 'actif', 100000),
  ('00000000-0000-0000-0000-0000000000e4', 'BOV-005', 'Bovin', 'N''dama', 'M', '2020-11-05', 'Fermé Yamoussoukro', '2021-01-15', 220000, 450, '00000000-0000-0000-0000-0000000000d0', 'Pâturage nord', 'actif', 350000);

-- ============ ANIMAL EVENTS ============
INSERT INTO animal_events (id, animal_id, lot_id, type, date, description, cost, responsible) VALUES
  ('00000000-0000-0000-0000-0000000000f0', '00000000-0000-0000-0000-0000000000e0', null, 'vaccination', '2026-01-15', 'Vaccination FMD', 15000, 'Dr. Brou Koffi'),
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000e1', null, 'vaccination', '2026-01-15', 'Vaccination FMD', 15000, 'Dr. Brou Koffi'),
  ('00000000-0000-0000-0000-0000000000f2', null, '00000000-0000-0000-0000-0000000000d0', 'vaccination', '2026-02-10', 'Vaccination collective lot bovins - PPCB', 175000, 'Dr. Brou Koffi'),
  ('00000000-0000-0000-0000-0000000000f3', '00000000-0000-0000-0000-0000000000e2', null, 'pesée', '2026-03-01', 'Pesée trimestrielle - 145kg', 0, 'Moussa Bakayoko'),
  ('00000000-0000-0000-0000-0000000000f4', '00000000-0000-0000-0000-0000000000e3', null, 'traitement', '2026-04-12', 'Traitement antiparasitaire', 8000, 'Dr. Brou Koffi'),
  ('00000000-0000-0000-0000-0000000000f5', null, '00000000-0000-0000-0000-0000000000d1', 'vente', '2026-05-20', 'Vente de 15 poulets à 3000 FCFA/u', 45000, 'Moussa Bakayoko'),
  ('00000000-0000-0000-0000-0000000000f6', null, '00000000-0000-0000-0000-0000000000d0', 'naissance', '2026-06-15', 'Naissance veau mâle', 0, 'Moussa Bakayoko'),
  ('00000000-0000-0000-0000-0000000000f7', '00000000-0000-0000-0000-0000000000e4', null, 'pesée', '2026-07-01', 'Pesée trimestrielle - 450kg', 0, 'Moussa Bakayoko');

-- ============ PROJECTS ============
INSERT INTO projects (id, name, type, responsible, initial_budget, revised_budget, start_date, expected_end_date, actual_end_date, status, progress, description, funding_id) VALUES
  ('00000000-0000-0000-0000-000000000100', 'Forage d''eau', 'Forage', 'Ibrahim Cissé', 3000000, 3200000, '2025-04-01', '2025-08-01', '2025-08-15', 'terminé', 100, 'Forage de 80m avec pompe solaire pour irrigation et abreuvement', '00000000-0000-0000-0000-000000000061'),
  ('00000000-0000-0000-0000-000000000101', 'Hangar d''élevage', 'Bâtiment', 'Ibrahim Cissé', 5000000, 5200000, '2025-07-01', '2026-02-01', null, 'en cours', 65, 'Construction hangar 200m² pour élevage volaille', '00000000-0000-0000-0000-000000000062'),
  ('00000000-0000-0000-0000-000000000102', 'Clôture périphérique', 'Clôture', 'Ibrahim Cissé', 1500000, 1500000, '2026-01-15', '2026-04-15', null, 'en cours', 40, 'Clôture 1.5km autour du site de Dabou', '00000000-0000-0000-0000-000000000063');

-- ============ PROJECT STEPS ============
INSERT INTO project_steps (id, project_id, name, budget, actual_cost, progress, responsible, date, status) VALUES
  ('00000000-0000-0000-0000-000000000110', '00000000-0000-0000-0000-000000000100', 'Étude géophysique', 300000, 280000, 100, 'Ibrahim Cissé', '2025-04-15', 'terminé'),
  ('00000000-0000-0000-0000-000000000111', '00000000-0000-0000-0000-000000000100', 'Forage 80m', 1500000, 1550000, 100, 'Ibrahim Cissé', '2025-06-01', 'terminé'),
  ('00000000-0000-0000-0000-000000000112', '00000000-0000-0000-0000-000000000100', 'Pompe solaire + raccordement', 1200000, 1370000, 100, 'Ibrahim Cissé', '2025-08-15', 'terminé'),
  ('00000000-0000-0000-0000-000000000113', '00000000-0000-0000-0000-000000000101', 'Terrassement et fondations', 800000, 850000, 100, 'Ibrahim Cissé', '2025-08-01', 'terminé'),
  ('00000000-0000-0000-0000-000000000114', '00000000-0000-0000-0000-000000000101', 'Structure métallique', 2000000, 2100000, 100, 'Ibrahim Cissé', '2025-11-01', 'terminé'),
  ('00000000-0000-0000-0000-000000000115', '00000000-0000-0000-0000-000000000101', 'Toiture et bardages', 1500000, 0, 0, 'Ibrahim Cissé', null, 'en cours'),
  ('00000000-0000-0000-0000-000000000116', '00000000-0000-0000-0000-000000000101', 'Aménagements intérieurs', 900000, 0, 0, 'Ibrahim Cissé', null, 'planifié'),
  ('00000000-0000-0000-0000-000000000117', '00000000-0000-0000-0000-000000000102', 'Piquetage et tracé', 100000, 100000, 100, 'Ibrahim Cissé', '2026-01-20', 'terminé'),
  ('00000000-0000-0000-0000-000000000118', '00000000-0000-0000-0000-000000000102', 'Pose poteaux + grillage', 1100000, 450000, 30, 'Ibrahim Cissé', null, 'en cours'),
  ('00000000-0000-0000-0000-000000000119', '00000000-0000-0000-0000-000000000102', 'Portails et finitions', 300000, 0, 0, 'Ibrahim Cissé', null, 'planifié');

-- ============ INVENTORY ITEMS ============
INSERT INTO inventory_items (id, name, category, unit, min_stock, current_stock, location, unit_cost) VALUES
  ('00000000-0000-0000-0000-000000000120', 'Ciment CIM 42.5', 'Matériaux', 'sacs', 20, 45, 'Magasin central', 5000),
  ('00000000-0000-0000-0000-000000000121', 'Aliment bovins grower', 'Alimentation animale', 'sacs 50kg', 10, 28, 'Magasin central', 28000),
  ('00000000-0000-0000-0000-000000000122', 'Semences Maïs Obatampa', 'Semences', 'kg', 20, 15, 'Magasin central', 3500),
  ('00000000-0000-0000-0000-000000000123', 'Engrais NPK 15-15-15', 'Engrais', 'sacs 50kg', 5, 8, 'Magasin central', 25000),
  ('00000000-0000-0000-0000-000000000124', 'Carburant diesel', 'Carburant', 'litres', 50, 120, 'Réservoir terrain', 850),
  ('00000000-0000-0000-0000-000000000125', 'Vaccin FMD', 'Produits vétérinaires', 'doses', 20, 35, 'Pharmacie ferme', 2000),
  ('00000000-0000-0000-0000-000000000126', 'Outils divers (pelles, pioches)', 'Outils', 'unités', 5, 12, 'Magasin central', 8000);

-- ============ INVENTORY MOVEMENTS ============
INSERT INTO inventory_movements (id, item_id, type, quantity, unit_cost, date, reason, linked_object_type, responsible) VALUES
  ('00000000-0000-0000-0000-000000000130', '00000000-0000-0000-0000-000000000120', 'achat', 80, 5000, '2025-07-15', 'Achat initial pour construction hangar', 'project', 'Ibrahim Cissé'),
  ('00000000-0000-0000-0000-000000000131', '00000000-0000-0000-0000-000000000120', 'consommation', 35, 5000, '2025-09-01', 'Utilisation fondations hangar', 'project', 'Ibrahim Cissé'),
  ('00000000-0000-0000-0000-000000000132', '00000000-0000-0000-0000-000000000121', 'achat', 40, 28000, '2026-01-20', 'Achat aliments bovins', null, 'Moussa Bakayoko'),
  ('00000000-0000-0000-0000-000000000133', '00000000-0000-0000-0000-000000000121', 'consommation', 12, 28000, '2026-02-15', 'Alimentation lot bovins', 'animal_lot', 'Moussa Bakayoko'),
  ('00000000-0000-0000-0000-000000000134', '00000000-0000-0000-0000-000000000122', 'achat', 25, 3500, '2026-03-05', 'Achat semences maïs', 'campaign', 'Sékou Camara'),
  ('00000000-0000-0000-0000-000000000135', '00000000-0000-0000-0000-000000000122', 'consommation', 25, 3500, '2026-03-10', 'Semis parcelle P-01', 'plot', 'Sékou Camara'),
  ('00000000-0000-0000-0000-000000000136', '00000000-0000-0000-0000-000000000123', 'achat', 12, 25000, '2026-03-20', 'Achat engrais NPK', null, 'Sékou Camara'),
  ('00000000-0000-0000-0000-000000000137', '00000000-0000-0000-0000-000000000123', 'consommation', 4, 25000, '2026-04-05', 'Fertilisation parcelle P-01', 'plot', 'Sékou Camara'),
  ('00000000-0000-0000-0000-000000000138', '00000000-0000-0000-0000-000000000124', 'achat', 200, 850, '2026-01-10', 'Plein réservoir terrain', null, 'Ibrahim Cissé'),
  ('00000000-0000-0000-0000-000000000139', '00000000-0000-0000-0000-000000000124', 'consommation', 80, 850, '2026-03-01', 'Carburant tracteur et véhicule', null, 'Ibrahim Cissé');

-- ============ INVENTORY COUNTS (with anomaly) ============
INSERT INTO inventory_counts (id, item_id, count_date, theoretical_stock, physical_stock, difference, justification, status, validated_by) VALUES
  ('00000000-0000-0000-0000-000000000140', '00000000-0000-0000-0000-000000000121', '2026-09-15', 28, 15, -13, 'Écart important à justifier - possible vol ou perte non enregistrée', 'en attente', null);

-- ============ BUDGETS ============
INSERT INTO budgets (id, object_type, object_id, object_name, initial_budget, revised_budget, committed_amount, paid_amount, period) VALUES
  ('00000000-0000-0000-0000-000000000150', 'project', '00000000-0000-0000-0000-000000000100', 'Forage d''eau', 3000000, 3200000, 3200000, 3200000, '2025'),
  ('00000000-0000-0000-0000-000000000151', 'project', '00000000-0000-0000-0000-000000000101', 'Hangar d''élevage', 5000000, 5200000, 2950000, 2950000, '2025-2026'),
  ('00000000-0000-0000-0000-000000000152', 'project', '00000000-0000-0000-0000-000000000102', 'Clôture périphérique', 1500000, 1500000, 550000, 550000, '2026'),
  ('00000000-0000-0000-0000-000000000153', 'campaign', '00000000-0000-0000-0000-0000000000a0', 'Campagne Maïs 2026', 1200000, 1200000, 780000, 780000, '2026'),
  ('00000000-0000-0000-0000-000000000154', 'campaign', '00000000-0000-0000-0000-0000000000a1', 'Campagne Soja 2026', 1800000, 1800000, 620000, 620000, '2026');
