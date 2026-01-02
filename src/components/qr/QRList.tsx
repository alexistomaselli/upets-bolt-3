import React, { useState } from 'react';
import { Plus, Filter, Download, QrCode, Store, Link, Info, Square, CheckSquare, User } from 'lucide-react';
import { useQRCodes } from '../../hooks/qr/useQRCodes';
import { useRegisterQRPrint } from '../../hooks/qr/useQRCodes';
import { QRCode as QRCodeType, QRFilters } from '../../types/qr';
import { Button, Input, EmptyState, TableSkeleton } from '../ui';
import { QRDetailModal } from './QRDetailModal';
import { AssignToCompanyModal } from './AssignToCompanyModal';

interface QRListProps {
  ownerId?: string;
  assignedCompanyId?: string;
  onCreateNew?: () => void;
  onView?: (qrCode: QRCodeType) => void;
  onEdit?: (qrCode: QRCodeType) => void;
  onDelete?: (qrCode: QRCodeType) => void;
  showActions?: boolean;
}

export const QRList: React.FC<QRListProps> = ({
  ownerId,
  assignedCompanyId,
  onCreateNew,
  onView,
  onEdit,
  onDelete,
  showActions = true,
}) => {
  const [selectedQR, setSelectedQR] = useState<QRCodeType | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedQRIds, setSelectedQRIds] = useState<string[]>([]);

  const [filters, setFilters] = useState<QRFilters>({
    owner_id: ownerId,
    assigned_company_id: assignedCompanyId,
  });

  const { data: qrCodes, isLoading, refetch } = useQRCodes(filters);
  const registerPrintMutation = useRegisterQRPrint();

  const handleFilterChange = (key: keyof QRFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const handleViewDetails = (qrCode: QRCodeType) => {
    setSelectedQR(qrCode);
    setShowDetailModal(true);
    if (onView) onView(qrCode);
  };

  const handleAssignClick = (qrId?: string) => {
    if (qrId) {
      setSelectedQRIds([qrId]);
    }
    // If no qrId provided, use existing selectedQRIds
    setShowAssignModal(true);
  };

  const toggleSelectAll = () => {
    if (selectedQRIds.length === (qrCodes?.length || 0)) {
      setSelectedQRIds([]);
    } else {
      setSelectedQRIds(qrCodes?.map(qr => qr.id) || []);
    }
  };

  const toggleSelectQR = (qrId: string) => {
    setSelectedQRIds(prev =>
      prev.includes(qrId)
        ? prev.filter(id => id !== qrId)
        : [...prev, qrId]
    );
  };

  const handleMarkAsPrinted = async (qrId: string) => {
    try {
      await registerPrintMutation.mutateAsync({
        qr_code_id: qrId,
        print_reason: 'manual',
        print_quality: 'standard',
        notes: 'Marcado como impreso desde administración'
      });
      setShowDetailModal(false);
    } catch (error) {
      console.error('Error marking as printed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Códigos QR</h2>
            <div className="h-4 bg-gray-200 rounded w-64 mt-2 animate-pulse"></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
            <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
            <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
            <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
          </div>
        </div>
        <TableSkeleton rows={5} columns={7} />
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
        <div className="flex space-x-3">
          {selectedQRIds.length > 0 && (
            <Button onClick={() => handleAssignClick()} icon={<Store className="h-4 w-4" />}>
              Asignar seleccionados ({selectedQRIds.length})
            </Button>
          )}
          {onCreateNew && (
            <Button onClick={onCreateNew} icon={<Plus className="h-4 w-4" />}>
              Crear QRs
            </Button>
          )}
        </div>
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
          </select>

          <select
            value={filters.assigned_company_id || ''}
            onChange={(e) => handleFilterChange('assigned_company_id', e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">Todos los S-Pets</option>
            <option value="unassigned">Sin asignar</option>
            {/* TODO: Cargar comercios dinámicamente */}
          </select>
          <select
            value={filters.is_printed?.toString() || ''}
            onChange={(e) => handleFilterChange('is_printed', e.target.value === 'true' ? true : e.target.value === 'false' ? false : undefined)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">Estado de impresión</option>
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
                  <th className="px-6 py-3 text-left">
                    <button onClick={toggleSelectAll} className="text-gray-500 hover:text-gray-700">
                      {selectedQRIds.length > 0 && selectedQRIds.length === qrCodes.length ? (
                        <CheckSquare className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Square className="h-5 w-5" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Impresión
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mascota/Dueño
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    S-Pet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Escaneos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Creación
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
                      <button onClick={() => toggleSelectQR(qrCode.id)} className="text-gray-500 hover:text-gray-700">
                        {selectedQRIds.includes(qrCode.id) ? (
                          <CheckSquare className="h-5 w-5 text-blue-600" />
                        ) : (
                          <Square className="h-5 w-5" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <QrCode className="h-5 w-5 text-green-600 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{qrCode.code}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(qrCode.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {qrCode.is_printed ? (
                        <div>
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Impreso ({qrCode.print_count}x)
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            Último: {qrCode.last_printed_at ? new Date(qrCode.last_printed_at).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          Sin imprimir
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${qrCode.status === 'active' ? 'bg-green-100 text-green-800' :
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      {qrCode.status === 'active' ? (
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-green-600 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {qrCode.pets?.name || 'Mascota sin nombre'}
                            </div>
                            <div className="text-xs text-gray-500">
                              Dueño: {qrCode.user_profiles?.first_name} {qrCode.user_profiles?.last_name}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Sin asignar</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {qrCode.assigned_company_id ? ( // CHANGED: Check ID directly
                        <div className="flex items-center">
                          <Store className="h-4 w-4 text-blue-600 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {qrCode.assigned_company?.name || 'S-Pet'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {qrCode.assigned_company?.city || 'Ciudad'}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <span className="text-sm text-gray-400 mr-2">Sin asignar</span>
                          <button
                            onClick={() => handleAssignClick(qrCode.id)}
                            className="inline-flex items-center px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                          >
                            <Link className="h-3 w-3 mr-1" />
                            Asignar
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {qrCode.scan_count || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        <div>{new Date(qrCode.created_at).toLocaleDateString()}</div>
                        {qrCode.activation_date && (
                          <div className="text-xs text-green-600">
                            Activado: {new Date(qrCode.activation_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </td>
                    {showActions && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewDetails(qrCode)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                            title="Ver detalles"
                          >
                            <Info className="h-4 w-4" />
                          </button>
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

      {/* QR Detail Modal */}
      <QRDetailModal
        qrCode={selectedQR}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onMarkAsPrinted={handleMarkAsPrinted}
      />

      {/* Assign Company Modal */}
      <AssignToCompanyModal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setSelectedQRIds([]); // Clear selection on close? Optional logic
        }}
        qrIds={selectedQRIds}
        onSuccess={() => {
          refetch(); // Refresh list
          setSelectedQRIds([]); // Clear selection
        }}
      />
    </div>
  );
};