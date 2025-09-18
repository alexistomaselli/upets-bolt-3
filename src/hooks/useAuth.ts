import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface UserProfile {
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
}

export interface UserRole {
  role_name: string;
  role_level: number;
}

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  roles: UserRole[];
  session: Session | null;
  loading: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    roles: [],
    session: null,
    loading: true,
  });

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Timeout de seguridad para evitar carga infinita
        const timeoutId = setTimeout(() => {
          if (mounted) {
            setAuthState(prev => ({
              ...prev,
              loading: false,
              user: null,
              session: null,
              profile: null,
              roles: []
            }));
          }
        }, 3000); // Reducir timeout
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        clearTimeout(timeoutId);

        if (error) {
          setAuthState(prev => ({
            ...prev,
            loading: false,
            user: null,
            session: null,
            profile: null,
            roles: []
          }));
          return;
        }
        

        if (session?.user) {
          // Cargar datos del usuario de forma bloqueante para evitar flash
          await loadUserData(session.user);
        } else {
          setAuthState(prev => ({
            ...prev,
            session,
            user: null,
            loading: false,
            profile: null,
            roles: []
          }));
        }

      } catch (error) {
        if (mounted) {
          setAuthState(prev => ({
            ...prev,
            loading: false,
            user: null,
            session: null,
            profile: null,
            roles: []
          }));
        }
      }
    };

    const loadUserData = async (user: User) => {
      try {
        // Cargar perfil
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        // Cargar roles
        let roles: UserRole[] = [];
        try {
          const { data: rolesData } = await supabase
            .rpc('get_user_roles', { user_uuid: user.id });
          
          roles = (rolesData || []).map(r => ({
            role_name: r.role_name,
            role_level: r.role_level
          }));
          
        } catch (rolesError) {
          roles = [];
        }

        if (mounted) {
          setAuthState(prev => ({
            ...prev,
            session: prev.session,
            user: user,
            profile: profile || null,
            roles: roles,
            loading: false,
          }));
          
        }

      } catch (error) {
        if (mounted) {
          setAuthState(prev => ({
            ...prev,
            session: prev.session,
            user: user,
            profile: null,
            roles: [],
            loading: false,
          }));
        }
      }
    };

    // Solo inicializar si Supabase está disponible
    if (!supabase) {
      console.warn('⚠️ Supabase no configurado, modo offline');
      setAuthState(prev => ({
        ...prev,
        loading: false,
        user: null,
        session: null,
        profile: null,
        roles: []
      }));
      return;
    }
    
    initializeAuth();

    // Listener para cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email || 'Sin usuario');
        
        if (session?.user) {
          await loadUserData(session.user);
        } else {
          setAuthState(prev => ({
            ...prev,
            session,
            user: null,
            profile: null,
            roles: [],
            loading: false,
          }));
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, userData?: {
    first_name?: string;
    last_name?: string;
    phone?: string;
  }) => {
    try {
      if (!supabase) {
        return { data: null, error: new Error('Supabase no configurado') };
      }
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        },
      });

      return { data, error };
    } catch (error) {
      console.error('Error in signUp:', error);
      return { data: null, error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      if (!supabase) {
        return { data: null, error: new Error('Supabase no configurado') };
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      return { data, error };
    } catch (error) {
      console.error('Error in signIn:', error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      if (!supabase) {
        return { error: new Error('Supabase no configurado') };
      }
      
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      console.error('Error in signOut:', error);
      return { error };
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!authState.user) return { error: new Error('No user logged in') };
    if (!supabase) return { error: new Error('Supabase no configurado') };

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', authState.user.id)
        .select()
        .single();

      if (!error && data) {
        setAuthState(prev => ({
          ...prev,
          profile: data,
        }));
      }

      return { data, error };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { data: null, error };
    }
  };

  const hasRole = (roleName: string): boolean => {
    return authState.roles.some(role => role.role_name === roleName);
  };

  const hasMinimumRole = (minimumLevel: number): boolean => {
    return authState.roles.some(role => role.role_level >= minimumLevel);
  };

  const hasPermission = async (resource: string, action: string): Promise<boolean> => {
    if (!authState.user || !supabase) return false;

    try {
      const { data, error } = await supabase
        .rpc('user_has_permission', {
          user_uuid: authState.user.id,
          resource_name: resource,
          action_name: action,
        });

      if (error) {
        console.error('Error checking permission:', error);
        return false;
      }

      return data || false;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  };

  const isSuperAdmin = (): boolean => {
    return hasRole('super_admin');
  };

  const isCompanyAdmin = (): boolean => {
    return hasRole('company_admin');
  };

  const isBranchAdmin = (): boolean => {
    return hasRole('branch_admin');
  };

  const isCustomer = (): boolean => {
    return hasRole('customer');
  };

  return {
    ...authState,
    signUp,
    signIn,
    signOut,
    updateProfile,
    hasRole,
    hasMinimumRole,
    hasPermission,
    isSuperAdmin,
    isCompanyAdmin,
    isBranchAdmin,
    isCustomer,
  };
};