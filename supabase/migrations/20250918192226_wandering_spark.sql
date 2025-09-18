/*
  # Actualizar modelo de QRs según nuevo flujo de negocio

  1. Cambios en tabla qr_codes
    - Eliminar campos de precio y compra (purchase_price, purchase_date)
    - Agregar campos de impresión (is_printed, print_batch_number, printed_at)
    - Agregar campos de suscripción (subscription_id, subscription_start_date)
    - Actualizar estados para incluir 'printed'

  2. Nueva tabla subscriptions
    - Gestión de planes de suscripción por QR
    - Información de facturación y comisiones

  3. Actualizar políticas RLS
    - Ajustar según el nuevo modelo
*/

-- Agregar campos de impresión a qr_codes
DO $$
BEGIN
  -- Campos de impresión
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'qr_codes' AND column_name = 'is_printed'
  ) THEN
    ALTER TABLE qr_codes ADD COLUMN is_printed boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'qr_codes' AND column_name = 'print_batch_number'
  ) THEN
    ALTER TABLE qr_codes ADD COLUMN print_batch_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'qr_codes' AND column_name = 'printed_at'
  ) THEN
    ALTER TABLE qr_codes ADD COLUMN printed_at timestamptz;
  END IF;

  -- Campos de suscripción
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'qr_codes' AND column_name = 'subscription_id'
  ) THEN
    ALTER TABLE qr_codes ADD COLUMN subscription_id uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'qr_codes' AND column_name = 'subscription_start_date'
  ) THEN
    ALTER TABLE qr_codes ADD COLUMN subscription_start_date timestamptz;
  END IF;

  -- Campo para branch asignado (distribución)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'qr_codes' AND column_name = 'assigned_branch_id'
  ) THEN
    ALTER TABLE qr_codes ADD COLUMN assigned_branch_id uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'qr_codes' AND column_name = 'assigned_at'
  ) THEN
    ALTER TABLE qr_codes ADD COLUMN assigned_at timestamptz;
  END IF;
END $$;

-- Crear tabla de suscripciones
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code_id uuid NOT NULL,
  user_id uuid NOT NULL,
  plan_type text NOT NULL DEFAULT 'basic', -- basic, premium, institutional
  monthly_price numeric(10,2) NOT NULL DEFAULT 500.00,
  commission_rate numeric(5,2) NOT NULL DEFAULT 10.00,
  branch_id uuid, -- Sucursal que vendió
  status text NOT NULL DEFAULT 'active', -- active, paused, cancelled, expired
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz,
  next_billing_date timestamptz,
  payment_method text,
  payment_status text DEFAULT 'pending', -- pending, paid, failed, cancelled
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_qr_code_id ON subscriptions(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_branch_id ON subscriptions(branch_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing_date ON subscriptions(next_billing_date);

-- RLS para subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas para subscriptions
CREATE POLICY "Super admins can manage all subscriptions"
  ON subscriptions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM get_user_roles(auth.uid()) 
      WHERE role_name = 'super_admin'
    )
  );

CREATE POLICY "Users can view own subscriptions"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Branch admins can view their branch subscriptions"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_users cu
      WHERE cu.branch_id = subscriptions.branch_id
      AND cu.user_id = auth.uid()
      AND cu.role = ANY(ARRAY['company_admin', 'branch_admin'])
      AND cu.is_active = true
    )
  );

-- Foreign keys para subscriptions
ALTER TABLE subscriptions 
ADD CONSTRAINT subscriptions_qr_code_id_fkey 
FOREIGN KEY (qr_code_id) REFERENCES qr_codes(id) ON DELETE CASCADE;

ALTER TABLE subscriptions 
ADD CONSTRAINT subscriptions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE subscriptions 
ADD CONSTRAINT subscriptions_branch_id_fkey 
FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;

-- Foreign key para assigned_branch_id en qr_codes
ALTER TABLE qr_codes 
ADD CONSTRAINT qr_codes_assigned_branch_id_fkey 
FOREIGN KEY (assigned_branch_id) REFERENCES branches(id) ON DELETE SET NULL;

-- Trigger para updated_at en subscriptions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Actualizar políticas de qr_codes para el nuevo modelo
DROP POLICY IF EXISTS "Branch admins can insert qr codes" ON qr_codes;
DROP POLICY IF EXISTS "Users can update own qr codes" ON qr_codes;
DROP POLICY IF EXISTS "Users can view own qr codes" ON qr_codes;

-- Nuevas políticas para qr_codes
CREATE POLICY "Super admins can manage all qr codes"
  ON qr_codes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM get_user_roles(auth.uid()) 
      WHERE role_name = 'super_admin'
    )
  );

CREATE POLICY "Branch admins can view assigned qr codes"
  ON qr_codes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_users cu
      WHERE cu.branch_id = qr_codes.assigned_branch_id
      AND cu.user_id = auth.uid()
      AND cu.role = ANY(ARRAY['company_admin', 'branch_admin'])
      AND cu.is_active = true
    )
  );

CREATE POLICY "Users can view and update own active qr codes"
  ON qr_codes
  FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Política para escaneo público (anónimo)
CREATE POLICY "Anyone can view active qr codes for scanning"
  ON qr_codes
  FOR SELECT
  TO anon
  USING (status = 'active');