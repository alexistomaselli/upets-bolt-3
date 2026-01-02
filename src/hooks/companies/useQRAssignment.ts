import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Company } from '../../types/company';

// Tipo para los QRs disponibles
export interface QRCode {
  id: string;
  code: string;
  status: 'available' | 'assigned' | 'activated';
  company_id?: string;
}

// Hook para obtener QRs disponibles
export const useAvailableQRs = () => {
  return useQuery({
    queryKey: ['available-qrs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('qr_codes')
        .select('*')
        .eq('status', 'available');
      
      if (error) throw error;
      return data as QRCode[];
    }
  });
};

// Hook para obtener QRs asignados a un comercio
export const useCompanyQRs = (companyId?: string) => {
  return useQuery({
    queryKey: ['company-qrs', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      const { data, error } = await supabase
        .from('qr_codes')
        .select('*')
        .eq('company_id', companyId);
      
      if (error) throw error;
      return data as QRCode[];
    },
    enabled: !!companyId
  });
};

// Hook para asignar QRs a un comercio
export const useAssignQRs = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      companyId, 
      qrCodes 
    }: { 
      companyId: string; 
      qrCodes: string[] 
    }) => {
      // Actualizar los QRs seleccionados con el company_id y cambiar su estado
      const { data, error } = await supabase
        .from('qr_codes')
        .update({ 
          company_id: companyId,
          status: 'assigned'
        })
        .in('code', qrCodes);
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidar consultas relacionadas para actualizar la UI
      queryClient.invalidateQueries({ queryKey: ['available-qrs'] });
      queryClient.invalidateQueries({ queryKey: ['company-qrs', variables.companyId] });
    }
  });
};

// Hook para desasignar QRs de un comercio
export const useUnassignQRs = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      companyId, 
      qrCodes 
    }: { 
      companyId: string; 
      qrCodes: string[] 
    }) => {
      // Actualizar los QRs seleccionados para eliminar el company_id y cambiar su estado
      const { data, error } = await supabase
        .from('qr_codes')
        .update({ 
          company_id: null,
          status: 'available'
        })
        .in('code', qrCodes)
        .eq('company_id', companyId);
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidar consultas relacionadas para actualizar la UI
      queryClient.invalidateQueries({ queryKey: ['available-qrs'] });
      queryClient.invalidateQueries({ queryKey: ['company-qrs', variables.companyId] });
    }
  });
};