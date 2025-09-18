import React, { useState } from 'react';
import { Plus, Filter, Download, QrCode, Printer, Building, Calendar, Eye } from 'lucide-react';
import { useQRCodes } from '../../hooks/qr/useQRCodes';
import { QRCode as QRCodeType, QRFilters } from '../../types/qr';
import { Button, Input, EmptyState, LoadingSpinner } from '../ui';

interface QRListProps {
  ownerId?: string;
  assignedBranchId?: string;
  onCreateNew?: () => void;
  onView?: (qrCode: QRCode) => void;
  onEdit?: (qrCode: QRCode) => void;
  onDelete?: (qrCode: QRCode) => void;
  showActions?: boolean;
}

export const QRList: React.FC<QRListProps> = ({
  ownerId,
  assignedBranchId,
  onCreateNew,
  onView,
  onEdit,
  onDelete,
  showActions = true,
}) => {
  const [filters, setFilters] = useState<QRFilters>({
    owner_id: ownerId,
    sold_by_branch_id: assignedBranchId,
  });

  const { data: qrCodes, isLoading } = useQRCodes(filters);

  const handleFilterChange = (key: keyof QRFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
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
            Crear QRs
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

          <Button variant="outline" icon={<Download className="h-4 w-4" />}>
            Exportar
          </Button>
        </div>

        <div className="mt-4 flex items-center text-sm text-gray-600">
          <Filter className="h-4 w-4 mr-2" />
          {qrCodes?.length || 0} códigos QR encontrados
        </div>
      </div>

      {/* QR Codes Table */}
      {!qrCodes || qrCodes.length === 0 ? (
        <EmptyState
          icon={<QrCode className="h-12 w-12" />}
          title="No hay códigos QR"
          description="No se encontraron códigos QR con los filtros aplicados"
          action={
            onCreateNew && (
              <Button onClick={onCreateNew} icon={<Plus className="h-4 w-4" />}>
                Crear QRs
              </Button>
            )
          }
        />
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Escaneos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Creación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activación
                  </th>
                  {showActions && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {qrCodes.map((qrCode) => (
                  <tr key={qrCode.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <QrCode className="h-5 w-5 text-green-600 mr-3" />
                        <span className="text-sm font-medium text-gray-900">{qrCode.code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        qrCode.qr_type === 'basic' ? 'bg-gray-100 text-gray-800' :
                        qrCode.qr_type === 'premium' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {qrCode.qr_type === 'basic' ? 'Básico' : 
                         qrCode.qr_type === 'premium' ? 'Premium' : 'Institucional'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        qrCode.status === 'active' ? 'bg-green-100 text-green-800' :
                        qrCode.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                        qrCode.status === 'lost' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {qrCode.status === 'active' ? 'Activo' :
                         qrCode.status === 'inactive' ? 'Inactivo' :
                         qrCode.status === 'lost' ? 'Perdido' :
                         qrCode.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {qrCode.scan_count || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        {new Date(qrCode.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {qrCode.activation_date ? (
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-green-600" />
                          {new Date(qrCode.activation_date).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-gray-400">Sin activar</span>
                      )}
                    </td>
                    {showActions && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {onView && (
                            <button
                              onClick={() => onView(qrCode)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          )}
                          {onEdit && (
                            <button
                              onClick={() => onEdit(qrCode)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Editar
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};