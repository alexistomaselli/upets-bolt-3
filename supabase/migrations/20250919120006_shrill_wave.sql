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
      - `qr_code_id` (uuid, foreign key a qr_codes)
      - `printed_by` (uuid, foreign key a users)
      - `print_reason` (text) - Motivo de la impresión
      - `print_quality` (text) - Calidad de impresión
      - `printer_info` (jsonb) - Información de la impresora
      - `notes` (text) - Notas adicionales
      - `printed_at` (timestamp)

  3. Seguridad
    - Enable RLS on `qr_print_history` table
    - Add policies for super admins to manage print history
    - Add function to register prints with automatic history tracking
*/

-- Agregar columnas a qr_codes para control de impresión
ALTER TABLE qr_codes 
ADD COLUMN IF NOT EXISTS is_printed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS first_printed_at timestamptz,
ADD COLUMN IF NOT EXISTS last_printed_at timestamptz,
ADD COLUMN IF NOT EXISTS print_count integer DEFAULT 0;

-- Crear tabla de historial de impresiones
CREATE TABLE IF NOT EXISTS qr_print_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code_id uuid NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,
  printed_by uuid REFERENCES auth.users(id),
  print_reason text DEFAULT 'manual',
  print_quality text DEFAULT 'standard',
  printer_info jsonb DEFAULT '{}',
  notes text,
  printed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS en la nueva tabla
ALTER TABLE qr_print_history ENABLE ROW LEVEL SECURITY;

-- Políticas para qr_print_history
CREATE POLICY "Super admins can manage print history"
  ON qr_print_history
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM get_user_roles(auth.uid()) 
      WHERE role_name = 'super_admin'
    )
  );

-- Función para registrar una impresión
CREATE OR REPLACE FUNCTION register_qr_print(
  p_qr_code_id uuid,
  p_printed_by uuid DEFAULT auth.uid(),
  p_print_reason text DEFAULT 'manual',
  p_print_quality text DEFAULT 'standard',
  p_printer_info jsonb DEFAULT '{}',
  p_notes text DEFAULT null
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insertar en historial
  INSERT INTO qr_print_history (
    qr_code_id,
    printed_by,
    print_reason,
    print_quality,
    printer_info,
    notes
  ) VALUES (
    p_qr_code_id,
    p_printed_by,
    p_print_reason,
    p_print_quality,
    p_printer_info,
    p_notes
  );

  -- Actualizar qr_codes
  UPDATE qr_codes 
  SET 
    is_printed = true,
    last_printed_at = now(),
    print_count = print_count + 1,
    first_printed_at = COALESCE(first_printed_at, now()),
    updated_at = now()
  WHERE id = p_qr_code_id;
END;
$$;

-- Índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_qr_print_history_qr_code_id ON qr_print_history(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_qr_print_history_printed_at ON qr_print_history(printed_at);
CREATE INDEX IF NOT EXISTS idx_qr_codes_is_printed ON qr_codes(is_printed);
CREATE INDEX IF NOT EXISTS idx_qr_codes_print_count ON qr_codes(print_count);