export interface Company {
  id: string;
  name: string;
  type: CompanyType;
  business_type: string | null;
  tax_id: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string;
  website: string | null;
  social_media: Record<string, string>;
  commission_rate: number;
  special_terms: string | null;
  payment_terms: string | null;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  notes: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}



export interface CompanyUser {
  id: string;
  company_id: string;

  user_id: string;
  role: 'company_admin' | 'staff';
  permissions: Record<string, unknown>;
  assigned_by: string | null;
  assigned_at: string;
  is_active: boolean;
  company?: Company;
}


export type CompanyType = 'veterinary' | 'shelter' | 'pet_shop' | 'grooming' | 'other';
export type CompanyStatus = 'active' | 'inactive' | 'pending' | 'suspended';
export type BranchStatus = 'active' | 'inactive' | 'maintenance';
export type CompanyUserRole = 'company_admin' | 'staff';