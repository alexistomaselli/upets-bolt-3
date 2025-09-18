import React from 'react';
import { QrCode, Eye, MapPin, TrendingUp, Calendar, Printer, Building } from 'lucide-react';
import { useQRStats } from '../../hooks/qr/useQRCodes';
import { Card, Badge, LoadingSpinner } from '../ui';

interface QRStatsProps {
  ownerId?: string;
  branchId?: string;
}

export const QRStats: React.FC<QRStatsProps> = ({ ownerId, branchId }) => {
  const { data: stats, isLoading } = useQRStats({ 
    owner_id: ownerId, 
    branch_id: branchId 
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: 'Total QRs',
      value: stats.total_qrs,
      icon: QrCode,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'QRs Impresos',
      value: stats.printed_qrs,
      icon: Printer,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'QRs Asignados',
      value: stats.assigned_qrs,
      icon: Building,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'QRs Activos',
      value: stats.active_qrs,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <div className="flex items-center">
              <div className={`p-3 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <Eye className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Escaneos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_scans}</p>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <MapPin className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Mascotas Encontradas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pets_found}</p>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Suscripciones Activas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active_subscriptions}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Scans */}
      {stats.recent_scans && stats.recent_scans.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Escaneos Recientes</h3>
            <Badge variant="info" size="sm">
              Últimos 10
            </Badge>
          </div>

          <div className="space-y-4">
            {stats.recent_scans.map((scan) => (
              <div key={scan.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Eye className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      QR: {(scan.qr_code as any)?.code}
                    </p>
                    {(scan.qr_code as any)?.pet && (
                      <p className="text-sm text-gray-600">
                        Mascota: {(scan.qr_code as any).pet.name}
                      </p>
                    )}
                    {scan.scan_location && (
                      <p className="text-sm text-gray-600">
                        Ubicación: {scan.scan_location}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(scan.scan_date).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(scan.scan_date).toLocaleTimeString()}
                  </div>
                  {scan.contact_made && (
                    <Badge variant="success" size="sm" className="mt-1">
                      Contacto realizado
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};