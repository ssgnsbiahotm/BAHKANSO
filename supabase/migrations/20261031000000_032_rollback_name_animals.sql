-- Rollback de la migration 031 : suppression de la colonne name inutile
-- La colonne name n'est plus utilisée (le formulaire utilise identifier)

ALTER TABLE animals DROP COLUMN IF EXISTS name;
