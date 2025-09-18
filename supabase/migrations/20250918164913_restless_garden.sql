/*
  # Arreglar recursión infinita en políticas RLS

  1. Changes
    - Crear función helper para verificar roles sin recursión
    - Actualizar políticas RLS problemáticas
    - Simplificar verificaciones de permisos

  2. Security
    - Mantener seguridad sin recursión
    - Funciones SECURITY DEFINER para bypass RLS cuando sea necesario
*/

-- Función helper para verificar si un usuario es company admin de una empresa específica
CREATE OR REPLACE FUNCTION is_company_admin_for_company(user_uuid uuid, company_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.company_users cu
    WHERE cu.user_id = user_uuid
    AND cu.company_id = company_uuid
    AND cu.role = 'company_admin'
    AND cu.is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función helper para verificar si un usuario es branch admin de una sucursal específica
CREATE OR REPLACE FUNCTION is_branch_admin_for_branch(user_uuid uuid, branch_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.company_users cu
    WHERE cu.user_id = user_uuid
    AND cu.branch_id = branch_uuid
    AND cu.role IN ('company_admin', 'branch_admin')
    AND cu.is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función helper para verificar si un usuario puede gestionar una empresa
CREATE OR REPLACE FUNCTION can_manage_company(user_uuid uuid, company_uuid uuid)
RETURNS boolean AS $$
BEGIN
  -- Super admin puede todo
  IF EXISTS (
    SELECT 1 FROM get_user_roles(user_uuid) 
    WHERE role_name = 'super_admin'
  ) THEN
    RETURN true;
  END IF;
  
  -- Company admin puede gestionar su empresa
  RETURN is_company_admin_for_company(user_uuid, company_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar políticas problemáticas existentes
DROP POLICY IF EXISTS "Company admins can manage users in their company" ON company_users;
DROP POLICY IF EXISTS "Company admins can view and update their company" ON companies;
DROP POLICY IF EXISTS "Company admins can update their company" ON companies;
DROP POLICY IF EXISTS "Company admins can manage their company branches" ON branches;

-- Recrear políticas sin recursión

-- Políticas para companies
CREATE POLICY "Company admins can view their company"
  ON companies FOR SELECT
  TO authenticated
  USING (can_manage_company(auth.uid(), id));

CREATE POLICY "Company admins can update their company"
  ON companies FOR UPDATE
  TO authenticated
  USING (can_manage_company(auth.uid(), id));

-- Políticas para branches
CREATE POLICY "Company admins can manage their company branches"
  ON branches FOR ALL
  TO authenticated
  USING (can_manage_company(auth.uid(), company_id));

-- Políticas para company_users (sin recursión)
CREATE POLICY "Company admins can manage users in their company"
  ON company_users FOR ALL
  TO authenticated
  USING (can_manage_company(auth.uid(), company_id));

-- Política adicional para que los usuarios vean sus propias asignaciones
CREATE POLICY "Users can view their own company assignments"
  ON company_users FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());