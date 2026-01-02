import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Company, CompanyUser, CompanyType, CompanyStatus } from '../../types/company';

export const useCompanies = (filters?: {
  type?: CompanyType;
  status?: CompanyStatus;
  city?: string;
  search?: string;
}) => {
  return useQuery({
    queryKey: ['companies', filters],
    queryFn: async () => {
      let query = supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.city) {
        query = query.eq('city', filters.city);
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,business_type.ilike.%${filters.search}%`);
      }

      const { data, error: fetchError } = await query;
      
      if (fetchError) {
        console.error('Error fetching companies:', fetchError);
        throw fetchError;
      }

      return data as Company[];
    },
  });
};

export const useCompany = (id: string) => {
  return useQuery({
    queryKey: ['company', id],
    queryFn: async () => {
      const { data, error: fetchError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id);
      if (fetchError) throw fetchError;
      return data?.[0] as Company;
    },
    enabled: !!id,
  });
};

export const useCreateCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (companyData: Partial<Company>) => {
      const { data, error } = await supabase
        .from('companies')
        .insert([companyData])
        .select()
        .single();

      if (error) throw error;
      return data as Company;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
    onError: (err: Error) => {
      console.error('Mutation error:', err);
      alert('Error de mutación: ' + err.message);
    }
  });
};

export const useUpdateCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Company> }) => {
      const { data, error: updateError } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating company:', updateError);
        throw updateError;
      }

      return data as Company;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['company', data.id] });
    },
  });
};



export const useCompanyUsers = (companyId?: string) => {
  return useQuery({
    queryKey: ['company-users', companyId],
    queryFn: async () => {
      try {
        // Evitamos la recursión infinita seleccionando solo los campos necesarios de companies
        // en lugar de todos los campos con (*)
        let query = supabase
          .from('company_users')
          .select(`
            *,
            company:companies(id, name, type, status)
          `)
          .order('assigned_at', { ascending: false });

        if (companyId) {
          query = query.eq('company_id', companyId);
        }

        const { data, error: usersError } = await query;
        if (usersError) {
          console.error('Error fetching company users:', usersError);
          throw usersError;
        }
        return data as CompanyUser[];
      } catch (err: unknown) {
        console.error('Error in useCompanyUsers:', err);
        return [] as CompanyUser[]; // Retornamos un array vacío en caso de error
      }
    },
  });
};

export const useAssignUserToCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignment: Partial<CompanyUser>) => {
      try {
        const { data, error } = await supabase
          .from('company_users')
          .insert([assignment])
          .select(`
            *,
            company:companies(id, name, type, status)
          `)
          .single();

        if (error) {
          console.error('Error assigning user to company:', error);
          throw error;
        }
        return data as CompanyUser;
      } catch (err: unknown) { // Changed 'error' to 'err' and added 'unknown' type
        console.error('Error al asignar usuario a la empresa:', err); // Updated message
        throw err;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['company-users'] });
      queryClient.invalidateQueries({ queryKey: ['company-users', data.company_id] });
    },
  });
};