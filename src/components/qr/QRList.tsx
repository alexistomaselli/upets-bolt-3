import React, { useState } from 'react';
import { Plus, Filter, Download, QrCode, Printer, Building } from 'lucide-react';
import { useQRCodes } from '../../hooks/qr/useQRCodes';
import { QRCode, QRFilters } from '../../types/qr';
import { QRCard } from './QRCard';
import { Button, Input, EmptyState, LoadingSpinner } from '../ui';

interface QRListProps {
  ownerId?: string;
  assignedBranchId?: string;
  onCreateNew?: () => void;
  onView?: (qrCode: QRCode) => void;
  onEdit?: (qrCode: QRCode) => void;
  onDelete?: (qrCode: QRCode) => void;
  showActions?: boolean;
  onSelectQRs?: (selectedIds: string[]) => void;
  selectedQRs?: string[];
  showBulkActions?: boolean;
}

export const QRList: React.FC<QRListProps> = ({
  ownerId,
  assignedBranchId,
  onCreateNew,
  onView,
  onEdit,
  onDelete,
  showActions = true,
  onSelectQRs,
  selectedQRs = [],
  showBulkActions = false,
}) => {
  const [filters, setFilters] = useState<QRFilters>({
    owner_id: ownerId,
    assigned_branch_id: assignedBranchId,
  });

  const { data: qrCodes, isLoading } = useQRCodes(filters);

  const handleFilterChange = (key: keyof QRFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const handleSelectAll = () => {
    if (!qrCodes || !onSelectQRs) return;
    
    if (selectedQRs.length === qrCodes.length) {
      onSelectQRs([]);
    } else {
      onSelectQRs(qrCodes.map(qr => qr.id));
    }
  };

  const handleSelectQR = (qrId: string) => {
    if (!onSelectQRs) return;
    
    if (selectedQRs.includes(qrId)) {
      onSelectQRs(selectedQRs.filter(id => id !== qrId));
    } else {
      onSelectQRs([...selectedQRs, qrId]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Códigos QR</h2>
          <p className="text-gray-600 mt-1">
            Gestiona los códigos QR para identificación de mascotas
          </p>
        </div>
        {onCreateNew && (
          <Button onClick={onCreateNew} icon={<Plus className="h-4 w-4" />}>
            Nuevo Lote QR
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Buscar por código..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            leftIcon={<Filter className="h-4 w-4" />}
          />

          <select
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">Todos los estados</option>
            <option value="inactive">Inactivos</option>
            <option value="active">Activos</option>
            <option value="lost">Perdidos</option>
            <option value="found">Encontrados</option>
            <option value="printed">Impresos</option>
            <option value="assigned">Asignados</option>
            <option value="expired">Expirados</option>
          </select>

          <select
            value={filters.qr_type || ''}
            onChange={(e) => handleFilterChange('qr_type', e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">Todos los tipos</option>
            <option value="basic">Básico</option>
            <option value="premium">Premium</option>
            <option value="institutional">Institucional</option>
          </select>

          <select
            value={filters.is_printed?.toString() || ''}
            onChange={(e) => handleFilterChange('is_printed', e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">Todos (impreso/no)</option>
            <option value="true">Impresos</option>
            <option value="false">Sin imprimir</option>
          </select>

          <Button variant="outline" icon={<Download className="h-4 w-4" />}>
            Exportar
          </Button>
        </div>

        <div className="mt-4 flex items-center text-sm text-gray-600">
          <Filter className="h-4 w-4 mr-2" />
          {qrCodes?.length || 0} códigos QR encontrados
        </div>
      </div>

      {/* Bulk Actions */}
      {showBulkActions && selectedQRs.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800">
              {selectedQRs.length} QRs seleccionados
            </span>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 text-sm bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors">
                <Printer className="h-4 w-4 mr-1 inline" />
                Marcar como impresos
              </button>
              <button className="px-3 py-1 text-sm bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors">
                <Building className="h-4 w-4 mr-1 inline" />
                Asignar a comercio
              </button>
              <button 
                onClick={() => onSelectQRs && onSelectQRs([])}
                className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
              >
                Deseleccionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Codes Grid */}
      {!qrCodes || qrCodes.length === 0 ? (
        <EmptyState
          icon={<QrCode className="h-12 w-12" />}
          title="No hay códigos QR"
          description="Comienza creando tu primer lote de códigos QR para identificación de mascotas"
          action={
            onCreateNew && (
              <Button onClick={onCreateNew} icon={<Plus className="h-4 w-4" />}>
                Crear Primer Lote
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-4">
          {showBulkActions && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedQRs.length === qrCodes.length && qrCodes.length > 0}
                  onChange={handleSelectAll}
                  className="rounded text-green-600 mr-3"
                />
                <span className="text-sm font-medium text-gray-700">
                  Seleccionar todos ({qrCodes.length})
                </span>
              </label>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {qrCodes.map((qrCode) => (
              <QRCard
                key={qrCode.id}
                qrCode={qrCode}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
                showActions={showActions}
                isSelected={selectedQRs.includes(qrCode.id)}
                onSelect={showBulkActions ? () => handleSelectQR(qrCode.id) : undefined}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};