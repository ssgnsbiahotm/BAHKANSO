-- Add UNIQUE constraint on plots.reference (auto-generated PAR-NNN identifiers)
ALTER TABLE plots ADD CONSTRAINT plots_reference_unique UNIQUE (reference);
