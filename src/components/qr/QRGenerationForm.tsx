import React, { useState } from 'react';
import { Plus, QrCode, AlertCircle } from 'lucide-react';
import { useCreateQRs } from '../../hooks/qr/useQRCodes';
import { Button, Input, Card } from '../ui';

interface QRGenerationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const QRGenerationForm: React.FC<QRGenerationFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    quantity: 1,
    notes: '',
  });

  const createQRsMutation = useCreateQRs();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createQRsMutation.mutateAsync(formData);
      
      // Reset form
      setFormData({
        quantity: 1,
        qr_type: 'basic',
        notes: '',
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating QRs:', error);
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1;
    setFormData(prev => ({
      ...prev,
      quantity: Math.max(1, Math.min(1000, value)) // Límite entre 1 y 1000
    }));
  };


  return (
    <Card>
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <div className="bg-green-100 p-3 rounded-full">
            <QrCode className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Generar Códigos QR</h2>
            <p className="text-gray-600">Crea nuevos códigos QR para identificación de mascotas</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cantidad */}
          <div>
            <Input
              label="Cantidad de QRs a generar"
              type="number"
              min="1"
              max="1000"
              value={formData.quantity}
              onChange={handleQuantityChange}
              helperText="Puedes generar entre 1 y 1000 códigos QR de una vez"
              leftIcon={<Plus className="h-4 w-4" />}
              required
            />
          </div>

          {/* Tipo de QR */}

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas (Opcional)
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Notas sobre este lote de QRs (propósito, destino, etc.)"
            />
          </div>

          {/* Resumen */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Resumen de generación</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Cantidad:</span>
                <span className="font-medium">{formData.quantity} códigos QR</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2">
                <span className="text-gray-600">Estado inicial:</span>
                <span className="font-medium">Inactivo (listo para imprimir)</span>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Importante:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Los QRs se crearán en estado "inactivo"</li>
                  <li>Necesitarán ser impresos antes de asignar a comercios</li>
                  <li>Los códigos son únicos e irrepetibles</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            {onCancel && (
              <Button 
                type="button"
                variant="outline" 
                onClick={onCancel}
              >
                Cancelar
              </Button>
            )}
            <Button 
              type="submit"
              loading={createQRsMutation.isPending}
              icon={<QrCode className="h-4 w-4" />}
            >
              Generar {formData.quantity} QR{formData.quantity > 1 ? 's' : ''}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
};