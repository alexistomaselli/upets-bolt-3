export interface QRCode {
  id: string;
  code: string;
  pet_id: string | null;
  owner_id: string | null;
  qr_type: 'basic' | 'premium' | 'institutional';
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
  assigned_branch_id: string | null;
  assigned_at: string | null;
  
  // Campos de suscripción
  subscription_id: string | null;
  subscription_start_date: string | null;
  
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  
  // Relaciones
  pet?: Pet;
  owner?: UserProfile;
  assigned_branch?: Branch;
  scans?: QRScan[];
  subscription?: Subscription;
}

export interface Subscription {
  id: string;
  qr_code_id: string;
  user_id: string;
  plan_type: 'basic' | 'premium' | 'institutional';
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
  user?: UserProfile;
  branch?: Branch;
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
  qr_type: 'basic' | 'premium' | 'institutional';
  status: 'pending' | 'printing' | 'completed' | 'cancelled';
  created_by: string;
  printed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  
  // Relaciones
  qr_codes?: QRCode[];
  created_by_user?: UserProfile;
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
  branch?: Branch;
  assigned_by_user?: UserProfile;
}

export interface QRStats {
  total_qrs: number;
  printed_qrs: number;
  assigned_qrs: number;
  active_qrs: number;
  inactive_qrs: number;
  total_scans: number;
  pets_found: number;
  active_subscriptions: number;
  recent_scans: QRScan[];
}

export type QRType = 'basic' | 'premium' | 'institutional';
export type QRStatus = 'inactive' | 'printed' | 'assigned' | 'active' | 'lost' | 'found' | 'expired';
export type PrintBatchStatus = 'pending' | 'printing' | 'completed' | 'cancelled';
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'expired';

// Interfaces para formularios
export interface CreateQRData {
  quantity: number;
  qr_type: QRType;
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
  is_printed?: boolean;
  print_batch_number?: string | null;
  assigned_branch_id?: string | null;
  metadata?: Record<string, any>;
}

export interface QRFilters {
  status?: QRStatus;
  qr_type?: QRType;
  owner_id?: string;
  assigned_branch_id?: string;
  is_printed?: boolean;
  search?: string;
  date_from?: string;
  date_to?: string;
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