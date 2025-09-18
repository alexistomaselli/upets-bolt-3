import React, { useState } from 'react';
import { Plus, Printer, Building, QrCode, BarChart3 } from 'lucide-react';
import { QRCode, CreateQRData, CreatePrintBatchData, AssignToBranchData } from '../../types/qr';
import { useQRCodes, useCreateQRs, useCreatePrintBatch, useAssignToBranch } from '../../hooks/qr/useQRCodes';
import { useBranches } from '../../hooks/companies/useCompanies';
import { QRList } from './QRList';
import { QRStats } from './QRStats';
import { Button, Modal, Input, Card } from '../ui';

export const QRManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'list' | 'stats' | 'print' | 'assign'>('list');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedQRs, setSelectedQRs] = useState<string[]>([]);

  const [createData, setCreateData] = useState<CreateQRData>({
    quantity: 1,
    qr_type: 'basic',
    notes: '',
  });

  const [printData, setPrintData] = useState<CreatePrintBatchData>({
    qr_ids: [],
    notes: '',
  });

  const [assignData, setAssignData] = useState<AssignToBranchData>({
    branch_id: '',
    qr_ids: [],
    notes: '',
  });

  const { data: qrCodes } = useQRCodes();
  const { data: branches } = useBranches();
  const createQRsMutation = useCreateQRs();
  const createPrintBatchMutation = useCreatePrintBatch();
  const assignToBranchMutation = useAssignToBranch();

  const tabs = [
    { id: 'list', label: 'Lista de QRs', icon: QrCode },
    { id: 'stats', label: 'Estadísticas', icon: BarChart3 },
    { id: 'print', label: 'Gestión de Impresión', icon: Printer },
    { id: 'assign', label: 'Asignar a Comercios', icon: Building },
  ];

  const handleCreateQRs = async () => {
    try {
      await createQRsMutation.mutateAsync(createData);
      setShowCreateModal(false);
      setCreateData({
        quantity: 1,
        qr_type: 'basic',
        notes: '',
      });
    } catch (error) {
      console.error('Error creating QRs:', error);
    }
  };

  const handleCreatePrintBatch = async () => {
    try {
      await createPrintBatchMutation.mutateAsync({
        ...printData,
        qr_ids: selectedQRs,
      });
      setShowPrintModal(false);
      setSelectedQRs([]);
      setPrintData({ qr_ids: [], notes: '' });
    } catch (error) {
      console.error('Error creating print batch:', error);
    }
  };

  const handleAssignToBranch = async () => {
    try {
      await assignToBranchMutation.mutateAsync({
        ...assignData,
        qr_ids: selectedQRs,
      });
      setShowAssignModal(false);
      setSelectedQRs([]);
      setAssignData({ branch_id: '', qr_ids: [], notes: '' });
    } catch (error) {
      console.error('Error assigning to branch:', error);
    }
  };

  const inactiveQRs = qrCodes?.filter(qr => qr.status === 'inactive') || [];
  const printedQRs = qrCodes?.filter(qr => qr.is_printed && qr.status === 'printed') || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de QRs</h1>
          <p className="text-gray-600 mt-1">
            Administra el ciclo completo: creación → impresión → asignación → activación
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          icon={<Plus className="h-4 w-4" />}
        >
          Crear QRs
        </Button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
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

        <div className="p-6">
          {activeTab === 'list' && (
            <QRList 
              showActions={true}
            />
          )}

          {activeTab === 'stats' && (
            <QRStats />
          )}

          {activeTab === 'print' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Gestión de Impresión</h3>
                <Button 
                  onClick={() => setShowPrintModal(true)}
                  disabled={selectedQRs.length === 0}
                  icon={<Printer className="h-4 w-4" />}
                >
                  Crear Lote de Impresión ({selectedQRs.length})
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{inactiveQRs.length}</div>
                    <div className="text-sm text-gray-600">QRs sin imprimir</div>
                  </div>
                </Card>
                <Card>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{printedQRs.length}</div>
                    <div className="text-sm text-gray-600">QRs impresos</div>
                  </div>
                </Card>
                <Card>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {qrCodes?.filter(qr => qr.assigned_branch_id).length || 0}
                    </div>
                    <div className="text-sm text-gray-600">QRs asignados</div>
                  </div>
                </Card>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Flujo de impresión:</strong> Selecciona QRs inactivos → Crear lote de impresión → 
                  Los QRs pasan a estado "printed\" → Listos para asignar a comercios
                </p>
              </div>
            </div>
          )}

          {activeTab === 'assign' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Asignar a Comercios</h3>
                <Button 
                  onClick={() => setShowAssignModal(true)}
                  disabled={selectedQRs.length === 0}
                  icon={<Building className="h-4 w-4" />}
                >
                  Asignar a Comercio ({selectedQRs.length})
                </Button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Flujo de asignación:</strong> Selecciona QRs impresos → Asignar a comercio → 
                  El comercio puede vender el servicio → Cliente activa QR y paga suscripción
                </p>
              </div>

              {branches && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {branches.map((branch) => (
                    <Card key={branch.id}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">{branch.name}</h4>
                          <p className="text-sm text-gray-600">{branch.company?.name}</p>
                          <p className="text-sm text-gray-500">{branch.city}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            {qrCodes?.filter(qr => qr.assigned_branch_id === branch.id).length || 0}
                          </div>
                          <div className="text-xs text-gray-500">QRs asignados</div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create QRs Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Crear Nuevos QRs"
        size="md"
      >
        <div className="space-y-6">
          <Input
            label="Cantidad de QRs"
            type="number"
            min="1"
            max="1000"
            value={createData.quantity}
            onChange={(e) => setCreateData(prev => ({ 
              ...prev, 
              quantity: parseInt(e.target.value) || 1 
            }))}
            helperText="Cantidad de códigos QR a generar (máximo 1000)"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de QR
            </label>
            <select
              value={createData.qr_type}
              onChange={(e) => setCreateData(prev => ({ 
                ...prev, 
                qr_type: e.target.value as any 
              }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="basic">Básico</option>
              <option value="premium">Premium</option>
              <option value="institutional">Institucional</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas (Opcional)
            </label>
            <textarea
              rows={3}
              value={createData.notes}
              onChange={(e) => setCreateData(prev => ({ 
                ...prev, 
                notes: e.target.value 
              }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Notas sobre este lote de QRs..."
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">
              Se crearán <strong>{createData.quantity}</strong> códigos QR de tipo{' '}
              <strong>{createData.qr_type}</strong> en estado <strong>inactivo</strong>.
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4">
            <Button 
              variant="outline" 
              onClick={() => setShowCreateModal(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateQRs}
              loading={createQRsMutation.isPending}
            >
              Crear {createData.quantity} QRs
            </Button>
          </div>
        </div>
      </Modal>

      {/* Print Batch Modal */}
      <Modal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        title="Crear Lote de Impresión"
        size="md"
      >
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              Se crearán las instrucciones de impresión para <strong>{selectedQRs.length}</strong> códigos QR seleccionados.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas de Impresión
            </label>
            <textarea
              rows={3}
              value={printData.notes}
              onChange={(e) => setPrintData(prev => ({ 
                ...prev, 
                notes: e.target.value 
              }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Instrucciones especiales para la impresión..."
            />
          </div>

          <div className="flex items-center justify-end space-x-4">
            <Button 
              variant="outline" 
              onClick={() => setShowPrintModal(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleCreatePrintBatch}
              loading={createPrintBatchMutation.isPending}
              icon={<Printer className="h-4 w-4" />}
            >
              Crear Lote de Impresión
            </Button>
          </div>
        </div>
      </Modal>

      {/* Assign to Branch Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Asignar QRs a Comercio"
        size="md"
      >
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              Se asignarán <strong>{selectedQRs.length}</strong> códigos QR al comercio seleccionado 
              para que puedan vender el servicio.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comercio / Sucursal *
            </label>
            <select
              value={assignData.branch_id}
              onChange={(e) => setAssignData(prev => ({ 
                ...prev, 
                branch_id: e.target.value 
              }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            >
              <option value="">Seleccionar comercio...</option>
              {branches?.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name} - {branch.company?.name} ({branch.city})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas de Asignación
            </label>
            <textarea
              rows={3}
              value={assignData.notes}
              onChange={(e) => setAssignData(prev => ({ 
                ...prev, 
                notes: e.target.value 
              }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Instrucciones o notas para el comercio..."
            />
          </div>

          <div className="flex items-center justify-end space-x-4">
            <Button 
              variant="outline" 
              onClick={() => setShowAssignModal(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleAssignToBranch}
              loading={assignToBranchMutation.isPending}
              disabled={!assignData.branch_id}
              icon={<Building className="h-4 w-4" />}
            >
              Asignar a Comercio
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};