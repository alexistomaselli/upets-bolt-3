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
  
  // Campos de impresión
  is_printed: boolean;
  print_batch_number: string | null;
  printed_at: string | null;
  
  // Campos de asignación a comercios
  sold_by_branch_id: string | null;
  assigned_at: string | null;
  
  // Campos de suscripción
  subscription_id: string | null;
  subscription_start_date: string | null;
  
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  
  // Relaciones
  pets?: { name: string; species: string; breed: string | null };
  user_profiles?: { first_name: string | null; last_name: string | null; email: string };
  branches?: { name: string; city: string | null; company_id: string; companies: { name: string } };
  scans?: QRScan[];
  subscription?: Subscription;
}

export interface QRPrintHistory {
  id: string;
  qr_code_id: string;
  printed_by: string | null;
  print_reason: string;
  print_quality: string;
  printer_info: Record<string, any>;
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
  branch_id: string | null;
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
  branches?: { name: string; city: string | null };
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

export interface BranchAssignment {
  id: string;
  branch_id: string;
  qr_codes: string[]; // Array de IDs de QR
  quantity: number;
  assigned_by: string;
  assigned_at: string;
  notes: string | null;
  
  // Relaciones
  branches?: { name: string; city: string | null };
  assigned_by_user?: { first_name: string | null; last_name: string | null };
}

export interface QRStats {
  total_qrs: number;
  active_qrs: number;
  inactive_qrs: number;
  assigned_to_branch: number;
  assigned_to_pets: number;
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
  notes?: string;
}

export interface RegisterPrintData {
  qr_code_ids: string[];
  print_reason?: string;
  print_quality?: string;
  printer_info?: Record<string, any>;
  notes?: string;
}

export interface CreatePrintBatchData {
  qr_ids: string[];
  notes?: string;
}

export interface AssignToBranchData {
  branch_id: string;
  qr_ids: string[];
  notes?: string;
}

export interface UpdateQRData {
  pet_id?: string | null;
  owner_id?: string | null;
  status?: QRStatus;
  sold_by_branch_id?: string | null;
  metadata?: Record<string, any>;
}

export interface QRFilters {
  status?: QRStatus;
  owner_id?: string;
  sold_by_branch_id?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
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