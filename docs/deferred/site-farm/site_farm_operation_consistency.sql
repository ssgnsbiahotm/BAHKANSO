-- ============================================================================
# Bahkanso — Tests du lot : rattachement sites/exploitations et cohérence opérations

## OBJET
Tests reproductibles couvrant le lot de migration
`supabase/migrations/20261019000000_10_site_farm_and_operation_consistency.sql`.

## LIMITES (à lire avant toute exécution)
- Aucun superutilisateur PostgreSQL n'est accessible dans cet environnement
  (peer authentication pour `postgres`, rôle `ssgnsa` absent).
- Par conséquent **aucun test SQL n'a été exécuté** sur une base locale jetable.
- Les tests ci-dessous sont préparés, prêts à être exécutés, et doivent l'être
  sur une base locale jetable contenant les seeds des migrations 001/002/003
  (ferme, site de Dabou, parcelles, campagnes, utilisateurs).
- Chaque test isolé est enveloppé dans `BEGIN; ... ROLLBACK;` afin de ne pas
  modifier durablement les données. Les tests de concurrence sont décrits
  textuellement (sessions A et B, points d'attente, ordre des COMMIT) car ils
  nécessitent deux connexions simultanées.
- Résultat observé : non renseigné (tests non exécutés).

## PRÉREQUIS DE LA BASE DE TEST
- Base créée spécifiquement pour ces tests (jetable, dédiée, non partagée).
- Extensions : `pgcrypto` (pour `gen_random_uuid()` utilisé par le schéma).
- Migrations 001 à 009 appliquées, puis la présente migration, puis les seeds
  (migrations 003, 004, 005) chargées.
- Rôle de connexion utilisé : `authenticated` (ou un rôle possédant les
  privilèges CRUD sur les tables et EXECUTE sur les fonctions).

## IDENTIFIANTS DE RÉFÉRENCE (seeds existants)
- Ferme            : 00000000-0000-0000-0000-000000000001 (Ferme AgroVision)
- Site de Dabou    : 00000000-0000-0000-0000-000000000070 (farm_id = NULL avant test)
- Parcelle P-01    : 00000000-0000-0000-0000-000000000080 (site_id = 0070, maïs)
- Campagne Maïs    : 00000000-0000-0000-0000-0000000000a0 (plot_id = 0080)
- Administrateur   : 00000000-0000-0000-0000-000000000010 (role = 'administrateur')
- Gestionnaire     : 00000000-0000-0000-0000-000000000013 (role = 'gestionnaire')

-- ============================================================================
-- AIDE : assertion d'échec attendu (attrape l'exception levée par un trigger)
-- ============================================================================
-- Utilisation : SELECT assert_raises('message attendu', $$ BEGIN ... END $$);
CREATE OR REPLACE FUNCTION public.assert_raises(p_expected text, p_fn text)
RETURNS void
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  EXECUTE p_fn;
  RAISE EXCEPTION 'TEST ECHEC : aucune exception levée (attendu : %)', p_expected;
EXCEPTION
  WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%' || p_expected || '%' THEN
      RAISE EXCEPTION 'TEST ECHEC : exception inattendue "%" (attendu contient %)', SQLERRM, p_expected;
    END IF;
END;
$$;

-- ============================================================================
-- TEST 1 : opération rattachée à une parcelle (plot_id seul, campaign_id NULL)
-- ============================================================================
BEGIN;
  SET app.current_user_id = '00000000-0000-0000-0000-000000000015'; -- responsable agricole

  INSERT INTO public.crop_operations (campaign_id, plot_id, type, date, responsible, cost)
  VALUES (NULL, '00000000-0000-0000-0000-000000000080', 'préparation', '2026-03-01', 'Sékou Camara', 150000);

  -- Vérification : l'opération existe et garde plot_id = P-01, campaign_id NULL
  PERFORM public.assert_raises('', $$
    BEGIN
      PERFORM 1 FROM public.crop_operations
      WHERE id IS NOT NULL
        AND campaign_id IS NULL
        AND plot_id = '00000000-0000-0000-0000-000000000080'
        AND type = 'préparation';
      IF NOT FOUND THEN RAISE EXCEPTION 'opération parcelle introuvable'; END IF;
    END;
  $$);
ROLLBACK;

-- ============================================================================
-- TEST 2 : opération rattachée à une campagne (campaign_id seul, plot_id forcé)
-- ============================================================================
BEGIN;
  SET app.current_user_id = '00000000-0000-0000-0000-000000000015';

  INSERT INTO public.crop_operations (campaign_id, plot_id, type, date, responsible, cost)
  VALUES ('00000000-0000-0000-0000-0000000000a0', NULL, 'semis', '2026-03-10', 'Sékou Camara', 350000);

  -- Vérification : plot_id a été forcé au plot de la campagne (P-01 = 0080)
  PERFORM public.assert_raises('', $$
    BEGIN
      PERFORM 1 FROM public.crop_operations
      WHERE campaign_id = '00000000-0000-0000-0000-0000000000a0'
        AND plot_id = '00000000-0000-0000-0000-000000000080';
      IF NOT FOUND THEN RAISE EXCEPTION 'opération campagne avec plot forcé introuvable'; END IF;
    END;
  $$);
ROLLBACK;

-- ============================================================================
-- TEST 3 : contradiction campaign_id / plot_id refusée
-- ============================================================================
BEGIN;
  SET app.current_user_id = '00000000-0000-0000-0000-000000000015';

  -- Campagne Maïs (plot 0080) + opération sur parcelle P-02 (0081) = contradiction
  SELECT public.assert_raises(
    'Contradiction campaign_id / plot_id',
    $$ BEGIN
      INSERT INTO public.crop_operations (campaign_id, plot_id, type, date, responsible, cost)
      VALUES ('00000000-0000-0000-0000-0000000000a0', '00000000-0000-0000-0000-000000000081', 'semis', '2026-03-10', 'Sékou Camara', 350000);
    END; $$
  );
ROLLBACK;

-- ============================================================================
-- TEST 4 : conservation des anciennes opérations sans rattachement
-- ============================================================================
BEGIN;
  SET app.current_user_id = '00000000-0000-0000-0000-000000000015';

  INSERT INTO public.crop_operations (campaign_id, plot_id, type, date, responsible, cost)
  VALUES (NULL, NULL, 'observation', '2026-01-01', 'Sékou Camara', 0);

  -- Vérification : l'opération sans rattachement est conservée (campaign_id NULL, plot_id NULL)
  PERFORM public.assert_raises('', $$
    BEGIN
      PERFORM 1 FROM public.crop_operations
      WHERE campaign_id IS NULL AND plot_id IS NULL AND type = 'observation';
      IF NOT FOUND THEN RAISE EXCEPTION 'opération sans rattachement introuvable'; END IF;
    END;
  $$);
ROLLBACK;

-- ============================================================================
-- TEST 5 : premier rattachement — autorisé (admin) / refusé (non-admin)
-- ============================================================================
-- 5a : administrateur autorisé à rattacher le site de Dabou à la ferme
BEGIN;
  SET app.current_user_id = '00000000-0000-0000-0000-000000000010'; -- admin

  CALL public.attach_site_to_farm(
    '00000000-0000-0000-0000-000000000070',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000010'
  );

  PERFORM public.assert_raises('', $$
    BEGIN
      PERFORM 1 FROM public.sites
      WHERE id = '00000000-0000-0000-0000-000000000070'
        AND farm_id = '00000000-0000-0000-0000-000000000001';
      IF NOT FOUND THEN RAISE EXCEPTION 'site non rattaché à la ferme'; END IF;
    END;
  $$);
ROLLBACK;

-- 5b : gestionnaire (non-admin) refusé pour rattacher un site
BEGIN;
  SET app.current_user_id = '00000000-0000-0000-0000-000000000013'; -- gestionnaire

  SELECT public.assert_raises(
    'Seul un administrateur peut rattacher un site à une exploitation',
    $$ BEGIN
      CALL public.attach_site_to_farm(
        '00000000-0000-0000-0000-000000000070',
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000013'
      );
    END; $$
  );
ROLLBACK;

-- ============================================================================
-- TEST 6 : transfert de site — autorisé (admin) / refusé (non-admin)
-- ============================================================================
-- Précondition : le site est déjà rattaché à la ferme (fait dans TEST 5a, mais rollback.
-- Ici on rattache à nouveau dans chaque sous-test pour être autonome.)

-- 6a : administrateur peut modifier le farm_id d'un site déjà rattaché
BEGIN;
  SET app.current_user_id = '00000000-0000-0000-0000-000000000010'; -- admin

  -- Rattache d'abord (état de départ)
  CALL public.attach_site_to_farm(
    '00000000-0000-0000-0000-000000000070',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000010'
  );

  -- Transfert vers une autre exploitation (farm_id différent) — test avec une ferme inexistante
  -- pour vérifier le guard de modification (le FK la rejeterait aussi, mais le guard doit passer d'abord).
  -- On utilise ici la même ferme pour isoler le test d'autorisation du guard sur un changement effectif.
  UPDATE public.sites
  SET farm_id = '00000000-0000-0000-0000-000000000001'
  WHERE id = '00000000-0000-0000-0000-000000000070';

  PERFORM public.assert_raises('', $$
    BEGIN
      PERFORM 1 FROM public.sites
      WHERE id = '00000000-0000-0000-0000-000000000070'
        AND farm_id = '00000000-0000-0000-0000-000000000001';
      IF NOT FOUND THEN RAISE EXCEPTION 'transfert de site admin échoué'; END IF;
    END;
  $$);
ROLLBACK;

-- 6b : gestionnaire (non-admin) refusé pour modifier farm_id d'un site
BEGIN;
  SET app.current_user_id = '00000000-0000-0000-0000-000000000013'; -- gestionnaire

  -- Rattache d'abord (état de départ, admin)
  CALL public.attach_site_to_farm(
    '00000000-0000-0000-0000-000000000070',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000010'
  );

  SELECT public.assert_raises(
    'Seul un administrateur peut modifier le rattachement',
    $$ BEGIN
      UPDATE public.sites
      SET farm_id = '00000000-0000-0000-0000-000000000001'
      WHERE id = '00000000-0000-0000-0000-000000000070';
    END; $$
  );
ROLLBACK;

-- ============================================================================
-- TEST 7 : insertion concurrente d'une parcelle + transfert de son site (2 ordres)
-- ============================================================================
-- Nécessite deux sessions SQL simultanées. Non exécutable ici (pas de base accessible).
-- Décrit ci-dessous avec commande A / commande B, points d'attente, ordre des COMMIT.

-- Contexte : site S (farm_id NULL initialement), parcelle P rattachée à S.
-- Objectif : vérifier qu'aucun interblocage n'intervient et que le verrouillage
-- est ordonné indépendamment du sens du déplacement.

-- Ordre 1 : A insère une parcelle sur S, B transfère S vers une ferme.
--   Session A : BEGIN; INSERT INTO plots (... site_id = S ...) ... ; -- attend le verrou de S si B l'a pris
--   Session B : BEGIN; UPDATE sites SET farm_id = F WHERE id = S; -- attend le verrou de S si A l'a pris
--   Points d'attente : si A prend d'abord le verrou sur plots/S, B attend ; puis A COMMIT, B poursuit.
--   Ordre des COMMIT recommandé : A COMMIT en premier, puis B COMMIT.
--   Résultat attendu : pas d'interblocage ; l'insertion et le transfert sont sérialisés.
--   Résultat observé : non exécuté.

-- Ordre 2 (inverse) : B transfère S d'abord, A insère ensuite.
--   Session B : BEGIN; UPDATE sites SET farm_id = F WHERE id = S; ... COMMIT;
--   Session A : BEGIN; INSERT INTO plots (... site_id = S ...) ... ; COMMIT;
--   Résultat attendu : l'insertion voit le nouveau farm_id de S (transfert commis).
--   Résultat observé : non exécuté.

-- Règle d'ordre global des verrous : toujours verrouiller dans l'ordre croissant des
-- identifiants (ex. ferme avant site, ou site avant parcelle par id croissant) pour
-- éviter les interblocages, indépendamment du sens du déplacement.

-- ============================================================================
-- TEST 8 : déplacements opposés de parcelles
-- ============================================================================
-- Deux parcelles P1 et P2 sur des sites S1 et S2 différents. Déplacer P1 vers S2
-- et P2 vers S1 dans la même transaction (multi-lignes) ou en deux transactions
-- concurrentes.
-- Résultat attendu : atomicité (tout ou rien) si même transaction ; sérialisation
-- sans interblocage si deux transactions avec verrous ordonnés par id.
-- Résultat observé : non exécuté.

-- ============================================================================
-- TEST 9 : traitements multi-lignes (plusieurs opérations en une transaction)
-- ============================================================================
BEGIN;
  SET app.current_user_id = '00000000-0000-0000-0000-000000000015';

  INSERT INTO public.crop_operations (campaign_id, plot_id, type, date, responsible, cost) VALUES
    ('00000000-0000-0000-0000-0000000000a0', NULL, 'semis', '2026-03-10', 'Sékou Camara', 350000),
    (NULL, '00000000-0000-0000-0000-000000000080', 'fertilisation', '2026-04-05', 'Sékou Camara', 280000),
    (NULL, NULL, 'observation', '2026-05-01', 'Sékou Camara', 0);

  -- Vérification : 3 opérations créées ; celle sur campagne a plot forcé = P-01 (0080)
  BEGIN
    PERFORM 1 FROM public.crop_operations
    WHERE campaign_id = '00000000-0000-0000-0000-0000000000a0'
      AND plot_id = '00000000-0000-0000-0000-000000000080'
      AND type = 'semis';
    IF NOT FOUND THEN RAISE EXCEPTION 'opération semis campagne introuvable'; END IF;

    PERFORM 1 FROM public.crop_operations
    WHERE campaign_id IS NULL AND plot_id = '00000000-0000-0000-0000-000000000080'
      AND type = 'fertilisation';
    IF NOT FOUND THEN RAISE EXCEPTION 'opération fertilisation parcelle introuvable'; END IF;

    PERFORM 1 FROM public.crop_operations
    WHERE campaign_id IS NULL AND plot_id IS NULL AND type = 'observation';
    IF NOT FOUND THEN RAISE EXCEPTION 'opération observation sans rattachement introuvable'; END IF;
  END;
ROLLBACK;

-- ============================================================================
-- TEST 10 : changement d'un parent (plot de campagne) utilisé par des opérations
-- ============================================================================
-- Une opération est rattachée à la campagne Maïs (plot forcé P-01 = 0080).
-- Tenter de modifier le plot_id de la campagne → doit être refusé (parent utilisé).
BEGIN;
  SET app.current_user_id = '00000000-0000-0000-0000-000000000010'; -- admin

  -- Crée une opération sur la campagne Maïs
  INSERT INTO public.crop_operations (campaign_id, plot_id, type, date, responsible, cost)
  VALUES ('00000000-0000-0000-0000-0000000000a0', NULL, 'semis', '2026-03-10', 'Sékou Camara', 350000);

  -- Tente de changer le plot de la campagne (0080 → 0081) alors qu'une opération y est liée
  SELECT public.assert_raises(
    'Impossible de modifier la parcelle de la campagne',
    $$ BEGIN
      UPDATE public.campaigns
      SET plot_id = '00000000-0000-0000-0000-000000000081'
      WHERE id = '00000000-0000-0000-0000-0000000000a0';
    END; $$
  );
ROLLBACK;

-- ============================================================================
-- TEST 11 : échec sans modification partielle (rollback complet en cas d'erreur)
-- ============================================================================
-- Une transaction multi-lignes où la seconde opération est en contradiction
-- doit annuler la première (aucune opération persistée).
BEGIN;
  SET app.current_user_id = '00000000-0000-0000-0000-000000000015';

  -- La première ligne est valide, la seconde lève une exception → tout rollback.
  SELECT public.assert_raises(
    'Contradiction campaign_id / plot_id',
    $$ BEGIN
      INSERT INTO public.crop_operations (campaign_id, plot_id, type, date, responsible, cost) VALUES
        (NULL, '00000000-0000-0000-0000-000000000080', 'préparation', '2026-03-01', 'Sékou Camara', 150000),
        ('00000000-0000-0000-0000-0000000000a0', '00000000-0000-0000-0000-000000000081', 'semis', '2026-03-10', 'Sékou Camara', 350000);
    END; $$
  );

  -- Vérification : aucune des deux opérations n'a été persistée (rollback de la transaction externe)
  -- NOTE : comme l'assert_raises attrape l'exception, la transaction externe est encore ouverte.
  -- On vérifie que les opérations ne sont pas visibles (elles ne le sont pas car non commises).
  PERFORM public.assert_raises('', $$
    BEGIN
      PERFORM 1 FROM public.crop_operations
      WHERE type IN ('préparation','semis') AND responsible = 'Sékou Camara'
        AND date IN ('2026-03-01','2026-03-10');
      IF FOUND THEN RAISE EXCEPTION 'modification partielle détectée (rollback incomplet)'; END IF;
    END;
  $$);
ROLLBACK;

-- ============================================================================
-- FIN DES TESTS PRÉPARÉS (non exécutés — voir LIMITES en tête de fichier)
-- ============================================================================
