-- Migración para agregar 'individual' al enum company_type
ALTER TYPE company_type ADD VALUE IF NOT EXISTS 'individual';