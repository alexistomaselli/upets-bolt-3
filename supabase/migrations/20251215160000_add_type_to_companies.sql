-- Add type column to companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS type text CHECK (type IN ('veterinary', 'shelter', 'pet_shop', 'grooming', 'other'));
