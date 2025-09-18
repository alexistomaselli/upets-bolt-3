/*
  # Crear tabla qr_batches y arreglar foreign keys

  1. New Tables
    - `qr_batches`
      - `id` (uuid, primary key)
      - `batch_number` (text, unique)
      - `quantity` (integer)
      - `qr_type` (text)
      - `price_per_unit` (decimal)
      - `total_amount` (decimal)
      - `branch_id` (uuid, foreign key)
      - `created_by` (uuid, foreign key)
      - `status` (text)
      - `generated_at` (timestamp)
      - `delivered_at` (timestamp)
      - `notes` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Changes
    - Add `batch_id` column to `qr_codes` table
    - Add foreign key constraints for `batch_id` and `sold_by_branch_id`

  3. Security
    - Enable RLS on `qr_batches` table
    - Add policies for different user roles
*/

-- Create qr_batches table
CREATE TABLE IF NOT EXISTS qr_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number text UNIQUE NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  qr_type text NOT NULL DEFAULT 'basic',
  price_per_unit decimal(10,2) NOT NULL CHECK (price_per_unit >= 0),
  total_amount decimal(10,2) NOT NULL CHECK (total_amount >= 0),
  branch_id uuid REFERENCES branches(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'generated', 'delivered', 'cancelled')),
  generated_at timestamptz,
  delivered_at timestamptz,
  notes text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add batch_id to qr_codes table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'qr_codes' AND column_name = 'batch_id'
  ) THEN
    ALTER TABLE qr_codes ADD COLUMN batch_id uuid REFERENCES qr_batches(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add foreign key constraint for sold_by_branch_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'qr_codes_sold_by_branch_id_fkey'
  ) THEN
    ALTER TABLE qr_codes ADD CONSTRAINT qr_codes_sold_by_branch_id_fkey 
    FOREIGN KEY (sold_by_branch_id) REFERENCES branches(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_qr_batches_batch_number ON qr_batches(batch_number);
CREATE INDEX IF NOT EXISTS idx_qr_batches_branch_id ON qr_batches(branch_id);
CREATE INDEX IF NOT EXISTS idx_qr_batches_created_by ON qr_batches(created_by);
CREATE INDEX IF NOT EXISTS idx_qr_batches_status ON qr_batches(status);
CREATE INDEX IF NOT EXISTS idx_qr_codes_batch_id ON qr_codes(batch_id);

-- Trigger for updated_at
CREATE TRIGGER update_qr_batches_updated_at
  BEFORE UPDATE ON qr_batches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE qr_batches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for qr_batches
CREATE POLICY "Super admins can manage all qr batches"
  ON qr_batches FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM get_user_roles(auth.uid()) 
      WHERE role_name = 'super_admin'
    )
  );

CREATE POLICY "Company admins can manage batches for their branches"
  ON qr_batches FOR ALL
  TO authenticated
  USING (
    branch_id IS NULL OR
    EXISTS (
      SELECT 1 FROM company_users cu
      JOIN branches b ON cu.company_id = b.company_id
      WHERE b.id = qr_batches.branch_id
      AND cu.user_id = auth.uid()
      AND cu.role = 'company_admin'
      AND cu.is_active = true
    )
  );

CREATE POLICY "Branch admins can manage batches for their branch"
  ON qr_batches FOR ALL
  TO authenticated
  USING (
    branch_id IS NULL OR
    EXISTS (
      SELECT 1 FROM company_users cu
      WHERE cu.branch_id = qr_batches.branch_id
      AND cu.user_id = auth.uid()
      AND cu.role IN ('company_admin', 'branch_admin')
      AND cu.is_active = true
    )
  );

-- Function to increment QR scan count
CREATE OR REPLACE FUNCTION increment_qr_scan_count(qr_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE qr_codes 
  SET 
    scan_count = scan_count + 1,
    last_scan_date = now()
  WHERE id = qr_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;