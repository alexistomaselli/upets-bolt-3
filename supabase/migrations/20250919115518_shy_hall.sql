/*
  # Sistema de impresión de QRs

  1. Modificaciones a tabla existente
    - `qr_codes`
      - `is_printed` (boolean) - Si el QR ha sido impreso al menos una vez
      - `first_printed_at` (timestamp) - Fecha de primera impresión
      - `last_printed_at` (timestamp) - Fecha de última impresión
      - `print_count` (integer) - Número total de impresiones

  2. Nueva tabla
    - `qr_print_history`
      - `id` (uuid, primary key)
      - `qr_code_id` (uuid, foreign key)
      - `printed_by` (uuid, foreign key a users)
      - `print_reason` (text) - Motivo de la impresión
      - `print_quality` (text) - Calidad de impresión
      - `printer_info` (jsonb) - Información de la impresora
      - `notes` (text) - Notas adicionales
      - `printed_at` (timestamp)

  3. Seguridad
    - Enable RLS en nueva tabla
    - Políticas para super_admin y branch_admin
*/

-- Agregar campos de impresión a qr_codes
DO $$
BEGIN
  -- is_printed
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'qr_codes' AND column_name = 'is_printed'
  ) THEN
    ALTER TABLE qr_codes ADD COLUMN is_printed boolean DEFAULT false;
  END IF;

  -- first_printed_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'qr_codes' AND column_name = 'first_printed_at'
  ) THEN
    ALTER TABLE qr_codes ADD COLUMN first_printed_at timestamptz;
  END IF;

  -- last_printed_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'qr_codes' AND column_name = 'last_printed_at'
  ) THEN
    ALTER TABLE qr_codes ADD COLUMN last_printed_at timestamptz;
  END IF;

  -- print_count
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'qr_codes' AND column_name = 'print_count'
  ) THEN
    ALTER TABLE qr_codes ADD COLUMN print_count integer DEFAULT 0;
  END IF;
END $$;

-- Crear tabla de historial de impresiones
CREATE TABLE IF NOT EXISTS qr_print_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code_id uuid NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,
  printed_by uuid REFERENCES users(id),
  print_reason text DEFAULT 'manual',
  print_quality text DEFAULT 'standard',
  printer_info jsonb DEFAULT '{}',
  notes text,
  printed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_qr_print_history_qr_code_id ON qr_print_history(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_qr_print_history_printed_by ON qr_print_history(printed_by);
CREATE INDEX IF NOT EXISTS idx_qr_print_history_printed_at ON qr_print_history(printed_at);

-- Habilitar RLS
ALTER TABLE qr_print_history ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para qr_print_history
CREATE POLICY "Super admins can manage all print history"
  ON qr_print_history
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM get_user_roles(uid()) 
      WHERE role_name = 'super_admin'
    )
  );

CREATE POLICY "Branch admins can view their branch print history"
  ON qr_print_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM qr_codes qr
      JOIN company_users cu ON cu.branch_id = qr.sold_by_branch_id
      WHERE qr.id = qr_print_history.qr_code_id
      AND cu.user_id = uid()
      AND cu.role = ANY(ARRAY['company_admin', 'branch_admin'])
      AND cu.is_active = true
    )
  );

-- Función para registrar impresión
CREATE OR REPLACE FUNCTION register_qr_print(
  qr_code_id_param uuid,
  print_reason_param text DEFAULT 'manual',
  print_quality_param text DEFAULT 'standard',
  printer_info_param jsonb DEFAULT '{}',
  notes_param text DEFAULT null
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  print_record_id uuid;
  current_print_count integer;
BEGIN
  -- Obtener el contador actual de impresiones
  SELECT print_count INTO current_print_count
  FROM qr_codes
  WHERE id = qr_code_id_param;

  -- Actualizar campos de impresión en qr_codes
  UPDATE qr_codes
  SET 
    is_printed = true,
    last_printed_at = now(),
    print_count = COALESCE(print_count, 0) + 1,
    first_printed_at = CASE 
      WHEN first_printed_at IS NULL THEN now()
      ELSE first_printed_at
    END,
    updated_at = now()
  WHERE id = qr_code_id_param;

  -- Insertar registro en historial
  INSERT INTO qr_print_history (
    qr_code_id,
    printed_by,
    print_reason,
    print_quality,
    printer_info,
    notes
  ) VALUES (
    qr_code_id_param,
    uid(),
    print_reason_param,
    print_quality_param,
    printer_info_param,
    notes_param
  ) RETURNING id INTO print_record_id;

  RETURN print_record_id;
END;
$$;