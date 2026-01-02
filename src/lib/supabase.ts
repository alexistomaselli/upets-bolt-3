import { createClient } from '@supabase/supabase-js';

// Determinar si usar Supabase local o cloud
const useLocalSupabase = import.meta.env.VITE_USE_LOCAL_SUPABASE === 'true';

// Configuración para Supabase cloud
const cloudSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const cloudSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Configuración para Supabase local
const localSupabaseUrl = import.meta.env.VITE_LOCAL_SUPABASE_URL || 'http://localhost:54321';
const localSupabaseAnonKey = import.meta.env.VITE_LOCAL_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const localSupabaseServiceKey = import.meta.env.VITE_LOCAL_SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Seleccionar la configuración según el entorno
const supabaseUrl = useLocalSupabase ? localSupabaseUrl : cloudSupabaseUrl;
// Para desarrollo local, usamos el service_role key para evitar problemas con RLS
const supabaseAnonKey = useLocalSupabase ? localSupabaseServiceKey : cloudSupabaseAnonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('❌ Variables de entorno de Supabase no configuradas. VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY son requeridas para el entorno cloud.');
}



export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
})

// Tipos para TypeScript
export type Database = {
  public: {
    Tables: {
      roles: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          level: number;
          is_system: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          level?: number;
          is_system?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          level?: number;
          is_system?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      permissions: {
        Row: {
          id: string;
          resource: string;
          action: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          resource: string;
          action: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          resource?: string;
          action?: string;
          description?: string | null;
          created_at?: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          first_name: string | null;
          last_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          company_id: string | null;
          branch_id: string | null;
          metadata: any;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          company_id?: string | null;
          branch_id?: string | null;
          metadata?: any;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          company_id?: string | null;
          branch_id?: string | null;
          metadata?: any;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role_id: string;
          granted_by: string | null;
          granted_at: string;
          expires_at: string | null;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          role_id: string;
          granted_by?: string | null;
          granted_at?: string;
          expires_at?: string | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          role_id?: string;
          granted_by?: string | null;
          granted_at?: string;
          expires_at?: string | null;
          is_active?: boolean;
        };
      };
    };
    Functions: {
      get_user_roles: {
        Args: { user_uuid: string };
        Returns: { role_name: string; role_level: number }[];
      };
      user_has_permission: {
        Args: { user_uuid: string; resource_name: string; action_name: string };
        Returns: boolean;
      };
    };
  };
};