import React, { useState } from 'react';
import { X, QrCode, Calendar, MapPin, User, Printer, Eye, Building, Phone, Mail } from 'lucide-react';
import { QRCode } from '../../types/qr';
import { useQRPrintHistory } from '../../hooks/qr/useQRCodes';
import { Modal, Badge, Button, LoadingSpinner } from '../ui';
import { QRPreview } from './QRPreview';

interface QRDetailModalProps {
  qrCode: QRCode | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkAsPrinted?: (qrId: string) => void;
}

export const QRDetailModal: React.FC<QRDetailModalProps> = ({
  qrCode,
  isOpen,
  onClose,
  onMarkAsPrinted,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'scans' | 'prints'>('info');
  
  const { data: printHistory, isLoading: loadingPrintHistory } = useQRPrintHistory(qrCode?.id || '');

  if (!qrCode) return null;

  const tabs = [
    { id: 'info', label: 'Información General', icon: QrCode },
    { id: 'scans', label: `Escaneos (${qrCode.scan_count || 0})`, icon: Eye },
    { id: 'prints', label: `Impresiones (${qrCode.print_count || 0})`, icon: Printer },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'printed': return 'info';
      case 'assigned': return 'warning';
      case 'lost': return 'danger';
      case 'found': return 'success';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'inactive': return 'Inactivo';
      case 'printed': return 'Impreso';
      case 'assigned': return 'Asignado';
      case 'lost': return 'Perdido';
      case 'found': return 'Encontrado';
      default: return status;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" title={`QR: ${qrCode.code}`}>
      <div className="space-y-6">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'info' && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* QR Preview */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview del QR</h3>
              <QRPreview code={qrCode.code} size={200} />
            </div>

            {/* QR Information */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del QR</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Estado:</span>
                    <Badge variant={getStatusColor(qrCode.status)}>
                      {getStatusLabel(qrCode.status)}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Tipo:</span>
                    <Badge variant="info">
                      {qrCode.qr_type === 'basic' ? 'Básico' : 
                       qrCode.qr_type === 'premium' ? 'Premium' : 'Institucional'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Impreso:</span>
                    <Badge variant={qrCode.is_printed ? 'success' : 'default'}>
                      {qrCode.is_printed ? `Sí (${qrCode.print_count}x)` : 'No'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Creado:</span>
                    <span className="text-sm text-gray-900">
                      {new Date(qrCode.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {qrCode.activation_date && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Activado:</span>
                      <span className="text-sm text-gray-900">
                        {new Date(qrCode.activation_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {qrCode.first_printed_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Primera impresión:</span>
                      <span className="text-sm text-gray-900">
                        {new Date(qrCode.first_printed_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Pet Information */}
              {qrCode.status === 'active' && qrCode.pet && (
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Mascota Asignada</h4>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-green-600 mr-2" />
                      <span className="text-sm text-gray-900">{qrCode.pet.name}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {qrCode.pet.species} • {qrCode.pet.breed}
                    </div>
                  </div>
                </div>
              )}

              {/* Owner Information */}
              {qrCode.owner && (
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Dueño</h4>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-blue-600 mr-2" />
                      <span className="text-sm text-gray-900">
                        {qrCode.owner.first_name} {qrCode.owner.last_name}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">{qrCode.owner.email}</span>
                    </div>
                    {qrCode.owner.phone && (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">{qrCode.owner.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Branch Information */}
              {qrCode.assigned_branch && (
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Comercio Asignado</h4>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Building className="h-4 w-4 text-purple-600 mr-2" />
                      <span className="text-sm text-gray-900">{qrCode.assigned_branch.name}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">{qrCode.assigned_branch.city}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              {!qrCode.is_printed && onMarkAsPrinted && (
                <div className="border-t border-gray-200 pt-6">
                  <Button
                    onClick={() => onMarkAsPrinted(qrCode.id)}
                    icon={<Printer className="h-4 w-4" />}
                    className="w-full"
                  >
                    Marcar como Impreso
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'scans' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Historial de Escaneos</h3>
            
            {qrCode.scan_count === 0 ? (
              <div className="text-center py-8">
                <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Este QR aún no ha sido escaneado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Aquí mostraremos los escaneos cuando tengamos los datos */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Total de escaneos</p>
                      <p className="text-sm text-gray-600">
                        {qrCode.last_scan_date ? 
                          `Último: ${new Date(qrCode.last_scan_date).toLocaleDateString()}` : 
                          'Sin escaneos recientes'
                        }
                      </p>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {qrCode.scan_count}
                    </div>
                  </div>
                </div>
                
                {qrCode.last_scan_location && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 text-blue-600 mr-2" />
                      <div>
                        <p className="font-medium text-blue-900">Última ubicación</p>
                        <p className="text-sm text-blue-700">{qrCode.last_scan_location}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'prints' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Historial de Impresiones</h3>
            
            {loadingPrintHistory ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : !qrCode.is_printed ? (
              <div className="text-center py-8">
                <Printer className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Este QR aún no ha sido impreso</p>
                {onMarkAsPrinted && (
                  <Button
                    onClick={() => onMarkAsPrinted(qrCode.id)}
                    icon={<Printer className="h-4 w-4" />}
                  >
                    Marcar como Impreso
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-green-900">Estado de impresión</p>
                      <p className="text-sm text-green-700">
                        Impreso {qrCode.print_count} {qrCode.print_count === 1 ? 'vez' : 'veces'}
                      </p>
                      {qrCode.first_printed_at && (
                        <p className="text-xs text-green-600">
                          Primera impresión: {new Date(qrCode.first_printed_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Badge variant="success">Impreso</Badge>
                  </div>
                </div>

                {/* Print History */}
                {printHistory && printHistory.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Historial detallado</h4>
                    {printHistory.map((print) => (
                      <div key={print.id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                              <span className="text-sm font-medium text-gray-900">
                                {new Date(print.printed_at).toLocaleDateString()} - {new Date(print.printed_at).toLocaleTimeString()}
                              </span>
                            </div>
                            <div className="mt-1 text-sm text-gray-600">
                              Motivo: {print.print_reason} • Calidad: {print.print_quality}
                            </div>
                            {print.notes && (
                              <div className="mt-1 text-xs text-gray-500">
                                Notas: {print.notes}
                              </div>
                            )}
                          </div>
                          <Badge variant="info" size="sm">
                            #{printHistory.length - printHistory.indexOf(print)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};