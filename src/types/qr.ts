export interface QRCode {
  id: string;
  code: string;
  pet_id: string | null;
  owner_id: string | null;
  status: 'inactive' | 'printed' | 'assigned' | 'active' | 'lost' | 'found' | 'expired';
  activation_date: string | null;
  expiry_date: string | null;
  scan_count: number;
  last_scan_date: string | null;
  last_scan_location: string | null;
  
  is_printed: boolean;
  first_printed_at: string | null;
  last_printed_at: string | null;
  print_count: number;
  
  assigned_company_id: string | null;

  
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  
  // Relaciones
  pets?: { name: string; species: string; breed: string | null };
  user_profiles?: { first_name: string | null; last_name: string | null; email: string };

  assigned_company?: { name: string; city: string | null; type: string };
  scans?: QRScan[];
  print_history?: QRPrintHistory[];
}

export interface QRPrintHistory {
  id: string;
  qr_code_id: string;
  printed_by: string | null;
  print_reason: string;
  print_quality: string;
  printer_info: Record<string, unknown>;
  notes: string | null;
  printed_at: string;
  created_at: string;
  
  // Relaciones
  qr_code?: QRCode;
  printed_by_user?: {
    first_name: string | null;
    last_name: string | null;
  };
}

export interface Subscription {
  id: string;
  qr_code_id: string;
  user_id: string;
  monthly_price: number;
  commission_rate: number;

  status: 'active' | 'paused' | 'cancelled' | 'expired';
  start_date: string;
  end_date: string | null;
  next_billing_date: string | null;
  payment_method: string | null;
  payment_status: 'pending' | 'paid' | 'failed' | 'cancelled';
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  
  // Relaciones
  qr_code?: QRCode;
  user_profiles?: { first_name: string | null; last_name: string | null };

}

export interface QRScan {
  id: string;
  qr_code_id: string;
  scanner_ip: string | null;
  scanner_user_agent: string | null;
  scan_location: string | null;
  scan_date: string;
  contact_made: boolean;
  notes: string | null;
  
  // Relaciones
  qr_code?: QRCode;
}

export interface PrintBatch {
  id: string;
  batch_number: string;
  quantity: number;
  status: 'pending' | 'printing' | 'completed' | 'cancelled';
  created_by: string;
  printed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  
  // Relaciones
  qr_codes?: QRCode[];
  created_by_user?: { first_name: string | null; last_name: string | null };
}

// BranchAssignment interface removed, logic moved to CompanyAssignment
// Or if we need a company assignment interface:
export interface CompanyAssignment {
  id: string;
  company_id: string;
  qr_codes: string[];
  quantity: number;
  assigned_by: string;
  assigned_at: string;
  notes: string | null;
  
  assigned_company?: { name: string; city: string | null };
  assigned_by_user?: { first_name: string | null; last_name: string | null };
}

export interface QRStats {
  total_qrs: number;
  active_qrs: number;
  inactive_qrs: number;
  printed_qrs: number;
  assigned_qrs: number;

  assigned_to_pets: number;
  active_subscriptions: number;
  total_scans: number;
  pets_found: number;
  recent_scans: QRScan[];
}

export type QRStatus = 'inactive' | 'printed' | 'assigned' | 'active' | 'lost' | 'found' | 'expired';
export type PrintBatchStatus = 'pending' | 'printing' | 'completed' | 'cancelled';
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'expired';

// Interfaces para formularios
export interface CreateQRData {
  quantity: number;
  qr_type: 'basic' | 'premium' | 'institutional';
  notes?: string;
}

export interface RegisterPrintData {
  qr_code_ids: string[];
  print_reason?: string;
  print_quality?: string;
  printer_info?: Record<string, unknown>;
  notes?: string;
}

export interface CreatePrintBatchData {
  qr_ids: string[];
  notes?: string;
}

export interface AssignToCompanyData {
  company_id: string;
  qr_ids: string[];
  notes?: string;
}




export interface UpdateQRData {
  pet_id?: string | null;
  owner_id?: string | null;
  status?: QRStatus;

  metadata?: Record<string, unknown>;
}

export interface QRFilters {
  status?: QRStatus;
  owner_id?: string;

  search?: string;
  date_from?: string;
  date_to?: string;
  assigned_company_id?: string;
  is_printed?: boolean;
}

// Para el sistema de escaneo público
export interface PublicQRData {
  pet_name: string;
  pet_photo?: string;
  owner_name: string;
  owner_phone: string;
  owner_whatsapp?: string;
  emergency_contact?: {
    name: string;
    phone: string;
  };
  medical_info?: string;
  reward_offered?: boolean;
  reward_amount?: number;
  last_seen_location?: string;
  additional_notes?: string;
}