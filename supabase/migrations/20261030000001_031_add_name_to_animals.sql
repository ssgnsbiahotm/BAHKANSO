-- Add name column to animals table for display name separate from identifier
ALTER TABLE animals ADD COLUMN IF NOT EXISTS name text;