import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { QRCode, QRScan, PrintBatch, QRStats, QRFilters, CreateQRData, CreatePrintBatchData, AssignToBranchData, UpdateQRData } from '../../types/qr';

export const useQRCodes = (filters?: QRFilters) => {
  return useQuery({
    queryKey: ['qr-codes', filters],
    queryFn: async () => {
      let query = supabase
        .from('qr_codes')
        .select(`
          *,
          pet:pets(*),
          owner:user_profiles(*),
          assigned_branch:branches(*)
        `)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.qr_type) {
        query = query.eq('qr_type', filters.qr_type);
      }
      if (filters?.owner_id) {
        query = query.eq('owner_id', filters.owner_id);
      }
      if (filters?.assigned_branch_id) {
        query = query.eq('assigned_branch_id', filters.assigned_branch_id);
      }
      if (filters?.is_printed !== undefined) {
        query = query.eq('is_printed', filters.is_printed);
      }
      if (filters?.search) {
        query = query.or(`code.ilike.%${filters.search}%`);
      }
      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as QRCode[];
    },
  });
};

export const useQRCode = (id: string) => {
  return useQuery({
    queryKey: ['qr-code', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('qr_codes')
        .select(`
          *,
          pet:pets(*),
          owner:user_profiles(*),
          assigned_branch:branches(*),
          scans:qr_scans(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as QRCode;
    },
    enabled: !!id,
  });
};

export const useQRCodeByCode = (code: string) => {
  return useQuery({
    queryKey: ['qr-code-by-code', code],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('qr_codes')
        .select(`
          *,
          pet:pets(*),
          owner:user_profiles(*)
        `)
        .eq('code', code)
        .single();

      if (error) throw error;
      return data as QRCode;
    },
    enabled: !!code,
  });
};

export const useCreateQRs = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (qrData: CreateQRData) => {
      // Generar códigos QR únicos
      const qrCodes = [];
      for (let i = 0; i < qrData.quantity; i++) {
        const code = `QR${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        qrCodes.push({
          code,
          qr_type: qrData.qr_type,
          status: 'inactive',
          is_printed: false,
          metadata: { 
            creation_notes: qrData.notes,
            created_by_admin: true
          }
        });
      }

      const { data, error } = await supabase
        .from('qr_codes')
        .insert(qrCodes)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-codes'] });
    },
  });
};

export const useCreatePrintBatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (printData: CreatePrintBatchData) => {
      const batchNumber = `PRINT-${Date.now()}`;
      
      // Actualizar QRs a estado "printed"
      const { data, error } = await supabase
        .from('qr_codes')
        .update({
          is_printed: true,
          print_batch_number: batchNumber,
          printed_at: new Date().toISOString(),
          status: 'printed',
          metadata: supabase.raw(`metadata || '{"print_notes": "${printData.notes || ''}"}'::jsonb`)
        })
        .in('id', printData.qr_ids)
        .select();

      if (error) throw error;
      return { batch_number: batchNumber, qr_codes: data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-codes'] });
    },
  });
};

export const useAssignToBranch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignData: AssignToBranchData) => {
      // Asignar QRs al comercio
      const { data, error } = await supabase
        .from('qr_codes')
        .update({
          assigned_branch_id: assignData.branch_id,
          assigned_at: new Date().toISOString(),
          status: 'assigned',
          metadata: supabase.raw(`metadata || '{"assignment_notes": "${assignData.notes || ''}"}'::jsonb`)
        })
        .in('id', assignData.qr_ids)
        .select(`
          *,
          assigned_branch:branches(*)
        `);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-codes'] });
    },
  });
};

export const useMarkAsPrinted = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (qrIds: string[]) => {
      const { data, error } = await supabase
        .from('qr_codes')
        .update({
          is_printed: true,
          printed_at: new Date().toISOString(),
          status: 'printed'
        })
        .in('id', qrIds)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-codes'] });
    },
  });
};

export const useUpdateQRCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateQRData }) => {
      const { data, error } = await supabase
        .from('qr_codes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as QRCode;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['qr-codes'] });
      queryClient.invalidateQueries({ queryKey: ['qr-code', data.id] });
    },
  });
};

export const useActivateQRCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      qr_id, 
      pet_id, 
      owner_id 
    }: { 
      qr_id: string; 
      pet_id: string; 
      owner_id: string; 
    }) => {
      const { data, error } = await supabase
        .from('qr_codes')
        .update({
          pet_id,
          owner_id,
          status: 'active',
          activation_date: new Date().toISOString()
        })
        .eq('id', qr_id)
        .select()
        .single();

      if (error) throw error;
      return data as QRCode;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-codes'] });
    },
  });
};

export const useRecordQRScan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (scanData: {
      qr_code_id: string;
      scanner_ip?: string;
      scanner_user_agent?: string;
      scan_location?: string;
      contact_made?: boolean;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('qr_scans')
        .insert([{
          ...scanData,
          scan_date: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // Actualizar contador de escaneos en el QR
      await supabase.rpc('increment_qr_scan_count', { 
        qr_id: scanData.qr_code_id 
      });

      return data as QRScan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-codes'] });
      queryClient.invalidateQueries({ queryKey: ['qr-scans'] });
    },
  });
};

export const useQRStats = (filters?: { 
  owner_id?: string; 
  branch_id?: string; 
  date_from?: string; 
  date_to?: string; 
}) => {
  return useQuery({
    queryKey: ['qr-stats', filters],
    queryFn: async () => {
      // Esta función podría ser un RPC en Supabase para mejor performance
      const { data: qrCodes, error: qrError } = await supabase
        .from('qr_codes')
        .select('id, status, scan_count')
        .eq('owner_id', filters?.owner_id || '');

      if (qrError) throw qrError;

      const { data: recentScans, error: scansError } = await supabase
        .from('qr_scans')
        .select(`
          *,
          qr_code:qr_codes(code, pet:pets(name))
        `)
        .order('scan_date', { ascending: false })
        .limit(10);

      if (scansError) throw scansError;

      const stats: QRStats = {
        total_qrs: qrCodes.length,
        printed_qrs: qrCodes.filter(qr => qr.is_printed).length,
        assigned_qrs: qrCodes.filter(qr => qr.assigned_branch_id).length,
        active_qrs: qrCodes.filter(qr => qr.status === 'active').length,
        inactive_qrs: qrCodes.filter(qr => qr.status === 'inactive').length,
        total_scans: qrCodes.reduce((sum, qr) => sum + qr.scan_count, 0),
        pets_found: qrCodes.filter(qr => qr.status === 'found').length,
        active_subscriptions: 0, // TODO: Implementar cuando tengamos subscriptions
        recent_scans: recentScans || []
      };

      return stats;
    },
  });
};