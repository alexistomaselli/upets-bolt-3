import React, { useState } from 'react';
import { useCompanies } from '../../hooks/companies/useCompanies';
import { useAvailableQRs, useCompanyQRs, useAssignQRs, QRCode } from '../../hooks/companies/useQRAssignment';
import { Company } from '../../types/company';
import { QrCode, Search, Check } from 'lucide-react';

export const QRAssignment: React.FC = () => {
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQRs, setSelectedQRs] = useState<string[]>([]);

  const { data: companies, isLoading } = useCompanies({
    search: searchTerm || undefined,
  });
  
  const { data: availableQRs = [], isLoading: isLoadingQRs } = useAvailableQRs();
useCompanyQRs(selectedCompany?.id);
  const assignQRsMutation = useAssignQRs();

  const handleSelectCompany = (company: Company) => {
    setSelectedCompany(company);
    setSelectedQRs([]);
  };

  const handleToggleQR = (qrCode: string) => {
    if (selectedQRs.includes(qrCode)) {
      setSelectedQRs(selectedQRs.filter(code => code !== qrCode));
    } else {
      setSelectedQRs([...selectedQRs, qrCode]);
    }
  };

  const handleAssignQRs = async () => {
    if (!selectedCompany || selectedQRs.length === 0) return;
    
    try {
      await assignQRsMutation.mutateAsync({
        companyId: selectedCompany.id,
        qrCodes: selectedQRs
      });
      
      // Limpiar selección después de asignar
      setSelectedQRs([]);
      alert(`QRs asignados exitosamente a ${selectedCompany.name}`);
    } catch (error) {
      console.error('Error al asignar QRs:', error);
      alert('Error al asignar QRs. Por favor, intente nuevamente.');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Panel de selección de comercio */}
      <div className="md:col-span-1 bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Seleccionar Comercio</h3>
        
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar comercio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        </div>
        
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Cargando comercios...</p>
            </div>
          ) : companies?.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-600">No se encontraron comercios</p>
            </div>
          ) : (
            companies?.map((company) => (
              <div
                key={company.id}
                onClick={() => handleSelectCompany(company)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedCompany?.id === company.id
                    ? 'bg-green-100 border-2 border-green-500'
                    : 'hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <div className="font-medium text-gray-900">{company.name}</div>
                <div className="text-sm text-gray-600">
                  {company.type === 'commercial' ? 'Comercio' : company.type === 'individual' ? 'Individual' : 'Institución'}
                  {company.business_type ? ` - ${company.business_type}` : ''}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Panel de asignación de QRs */}
      <div className="md:col-span-2 bg-white rounded-xl shadow-lg p-6">
        {selectedCompany ? (
          <>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Asignar QRs a {selectedCompany.name}
              </h3>
              <p className="text-gray-600 mt-1">
                Selecciona los QRs que deseas asignar a este comercio
              </p>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    {selectedQRs.length} QRs seleccionados
                  </span>
                </div>
                <button
                  onClick={handleAssignQRs}
                  disabled={selectedQRs.length === 0 || assignQRsMutation.isPending}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {assignQRsMutation.isPending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Asignar QRs
                </button>
              </div>
            </div>
            
            {isLoadingQRs ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando QRs disponibles...</p>
              </div>
            ) : availableQRs.length === 0 ? (
              <div className="text-center py-8">
                <QrCode className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No hay QRs disponibles para asignar</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {availableQRs.map((qr) => (
                  <div
                    key={qr.id}
                    onClick={() => handleToggleQR(qr.code)}
                    className={`p-3 border rounded-lg cursor-pointer transition-all flex flex-col items-center ${
                      selectedQRs.includes(qr.code)
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <QrCode className={`h-8 w-8 mb-2 ${
                      selectedQRs.includes(qr.code) ? 'text-green-600' : 'text-gray-400'
                    }`} />
                    <div className="text-sm font-medium text-center">{qr.code}</div>
                    {selectedQRs.includes(qr.code) && (
                      <div className="mt-2 text-xs text-green-600 flex items-center">
                        <Check className="h-3 w-3 mr-1" />
                        Seleccionado
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center py-12">
            <QrCode className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Selecciona un comercio
            </h3>
            <p className="text-gray-600 max-w-md">
              Para asignar QRs, primero debes seleccionar un comercio o institución del panel izquierdo.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};