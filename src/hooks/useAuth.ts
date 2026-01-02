import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    roles: [],
    session: null,
    loading: true,
  });

  useEffect(() => {
    let mounted = true;

    // Si Supabase no está configurado, salir inmediatamente
    if (!supabase) {
      console.warn('⚠️ Supabase no configurado');
      setAuthState(prev => ({
        ...prev,
        loading: false,
      }));
      return;
    }

    const loadUserData = async (user: User) => {
      // Mantener loading en true mientras se cargan los datos
      if (mounted) {
        // Intentar cargar desde caché para respuesta instantánea
        const cachedProfile = localStorage.getItem(`profile_${user.id}`);
        const cachedRoles = localStorage.getItem(`roles_${user.id}`);
        
        if (cachedProfile && cachedRoles) {
          setAuthState(prev => ({
            ...prev,
            session: prev.session,
            user: user,
            profile: JSON.parse(cachedProfile),
            roles: JSON.parse(cachedRoles),
            loading: false, // Mostrar UI inmediatamente con datos cacheados
          }));
        } else {
           setAuthState(prev => ({
            ...prev,
            session: prev.session,
            user: user,
            loading: true,
          }));
        }
      }

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
          // Remover console.time para producción
          const { data: rolesData } = await supabase
            .rpc('get_user_roles', { user_uuid: user.id });
          
          roles = (rolesData || []).map(r => ({
            role_name: r.role_name,
            role_level: r.role_level
          }));
          
        } catch (rolesError) {
          console.warn('⚠️ Error cargando roles:', rolesError);
          roles = [];
        }

        if (mounted) {
          // Guardar en caché
          if (profile) localStorage.setItem(`profile_${user.id}`, JSON.stringify(profile));
          if (roles.length > 0) localStorage.setItem(`roles_${user.id}`, JSON.stringify(roles));

          setAuthState(prev => ({
            ...prev,
            profile: profile || null,
            roles: roles,
            loading: false, // Ahora sí terminamos de cargar todo
          }));
        }

      } catch (error) {
        console.error('❌ Error cargando datos de usuario:', error);
        if (mounted) {
          setAuthState(prev => ({
            ...prev,
            profile: null,
            roles: [],
            loading: false, // Terminar loading incluso si hay error
          }));
        }
      }
    };


    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('❌ Error getting session:', error);
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
          // Cargar datos del usuario de forma no bloqueante
          loadUserData(session.user);
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
        console.error('💥 Error en initializeAuth:', error);
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



    initializeAuth();

    // Listener para cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        
        if (session?.user) {
          loadUserData(session.user);
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
        throw new Error('Supabase no configurado');
      }
      
      console.log('🔐 Intentando login con:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Error en signIn:', error);
      } else {
        // Login exitoso
      }

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
      
      // Limpiar datos al cerrar sesión
      if (!error && authState.user) {
         localStorage.removeItem(`profile_${authState.user.id}`);
         localStorage.removeItem(`roles_${authState.user.id}`);
      }
      
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