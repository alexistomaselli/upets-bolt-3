import React, { useState, useEffect } from 'react';
import { ArrowLeft, Building, Heart, Save, ShoppingBag, Scissors, HelpCircle } from 'lucide-react';
import { LocationPicker } from '../common/LocationPicker';
import { Company, CompanyType, CompanyStatus } from '../../types/company';

interface CompanyFormProps {
  company?: Company | null;
  onSubmit: (data: Partial<Company>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const CompanyForm: React.FC<CompanyFormProps> = ({
  company,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const typeLabels: Record<CompanyType, string> = {
    veterinary: 'Veterinaria',
    shelter: 'Refugio',
    pet_shop: 'Pet Shop',
    grooming: 'Peluquería',
    other: 'Organización',
  };

  const [formData, setFormData] = useState({
    name: '',
    type: 'veterinary' as CompanyType,
    business_type: '',
    tax_id: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'AR',
    website: '',
    commission_rate: 10,
    special_terms: '',
    payment_terms: '',
    status: 'pending' as CompanyStatus,
    notes: '',
    metadata: {} as Record<string, any>,
  });

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        type: company.type || 'veterinary',
        business_type: company.business_type || '',
        tax_id: company.tax_id || '',
        email: company.email || '',
        phone: company.phone || '',
        address: company.address || '',
        city: company.city || '',
        state: company.state || '',
        postal_code: company.postal_code || '',
        country: company.country || 'AR',
        website: company.website || '',
        commission_rate: company.commission_rate || 10,
        special_terms: company.special_terms || '',
        payment_terms: company.payment_terms || '',
        status: company.status || 'pending',
        notes: company.notes || '',
        metadata: company.metadata || {},
      });
    }
  }, [company]);



  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await onSubmit(formData);
    } catch (err) {
      console.error('Error submitting form:', err);
      setError((err as Error).message || 'Error al guardar');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleLocationSelect = (lat: number, lng: number, address?: string, city?: string, state?: string, postalCode?: string) => {
    setFormData(prev => ({
      ...prev,
      address: address || prev.address,
      city: city || prev.city,
      state: state || prev.state,
      postal_code: postalCode || prev.postal_code,
      metadata: {
        ...prev.metadata,
        latitude: lat,
        longitude: lng
      }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onCancel}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {company ? 'Editar' : 'Nuevo'} {typeLabels[formData.type]}
          </h2>
          <p className="text-gray-600 mt-1">
            {company ? 'Modifica los datos de la' : 'Agrega una nueva'} {typeLabels[formData.type].toLowerCase()}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          {/* Tipo de Organización */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipo de Organización
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <label className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${formData.type === 'veterinary'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
                }`}>
                <input
                  type="radio"
                  name="type"
                  value="veterinary"
                  checked={formData.type === 'veterinary'}
                  onChange={handleChange}
                  className="sr-only"
                />
                <Building className={`h-6 w-6 mr-3 ${formData.type === 'veterinary' ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                <div>
                  <div className="font-medium text-gray-900">Veterinaria</div>
                  <div className="text-sm text-gray-600">Clínica y atención</div>
                </div>
              </label>

              <label className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${formData.type === 'shelter'
                ? 'border-pink-500 bg-pink-50'
                : 'border-gray-300 hover:border-gray-400'
                }`}>
                <input
                  type="radio"
                  name="type"
                  value="shelter"
                  checked={formData.type === 'shelter'}
                  onChange={handleChange}
                  className="sr-only"
                />
                <Heart className={`h-6 w-6 mr-3 ${formData.type === 'shelter' ? 'text-pink-600' : 'text-gray-400'
                  }`} />
                <div>
                  <div className="font-medium text-gray-900">Refugio</div>
                  <div className="text-sm text-gray-600">Adopción y cuidado</div>
                </div>
              </label>

              <label className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${formData.type === 'pet_shop'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 hover:border-gray-400'
                }`}>
                <input
                  type="radio"
                  name="type"
                  value="pet_shop"
                  checked={formData.type === 'pet_shop'}
                  onChange={handleChange}
                  className="sr-only"
                />
                <ShoppingBag className={`h-6 w-6 mr-3 ${formData.type === 'pet_shop' ? 'text-green-600' : 'text-gray-400'
                  }`} />
                <div>
                  <div className="font-medium text-gray-900">Pet Shop</div>
                  <div className="text-sm text-gray-600">Venta de productos</div>
                </div>
              </label>

              <label className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${formData.type === 'grooming'
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-300 hover:border-gray-400'
                }`}>
                <input
                  type="radio"
                  name="type"
                  value="grooming"
                  checked={formData.type === 'grooming'}
                  onChange={handleChange}
                  className="sr-only"
                />
                <Scissors className={`h-6 w-6 mr-3 ${formData.type === 'grooming' ? 'text-purple-600' : 'text-gray-400'
                  }`} />
                <div>
                  <div className="font-medium text-gray-900">Peluquería</div>
                  <div className="text-sm text-gray-600">Estética animal</div>
                </div>
              </label>

              <label className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${formData.type === 'other'
                ? 'border-gray-500 bg-gray-50'
                : 'border-gray-300 hover:border-gray-400'
                }`}>
                <input
                  type="radio"
                  name="type"
                  value="other"
                  checked={formData.type === 'other'}
                  onChange={handleChange}
                  className="sr-only"
                />
                <HelpCircle className={`h-6 w-6 mr-3 ${formData.type === 'other' ? 'text-gray-600' : 'text-gray-400'
                  }`} />
                <div>
                  <div className="font-medium text-gray-900">Otro</div>
                  <div className="text-sm text-gray-600">Otro tipo de servicio</div>
                </div>
              </label>
            </div>
          </div>

          {/* Información Básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre *
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Nombre del comercio o institución"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Negocio
              </label>
              <input
                type="text"
                name="business_type"
                value={formData.business_type}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Ej: Clínica 24hs, Venta de Alimento, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="contacto@ejemplo.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="+54 11 1234-5678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CUIT/CUIL
              </label>
              <input
                type="text"
                name="tax_id"
                value={formData.tax_id}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="20-12345678-9"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sitio Web
              </label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="https://ejemplo.com"
              />
            </div>
          </div>

          {/* Dirección */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Dirección</h3>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ubicación
              </label>
              <LocationPicker
                initialLat={formData.metadata?.latitude}
                initialLng={formData.metadata?.longitude}
                onLocationSelect={handleLocationSelect}
              />
              <p className="mt-1 text-xs text-gray-500">Selecciona la ubicación exacta en el mapa para completar los datos automáticamente.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Av. Corrientes 1234"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ciudad
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Buenos Aires"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Provincia
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Buenos Aires"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código Postal
                </label>
                <input
                  type="text"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="1000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  País
                </label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="AR">Argentina</option>
                  <option value="UY">Uruguay</option>
                  <option value="CL">Chile</option>
                </select>
              </div>
            </div>
          </div>

          {/* Configuración Comercial */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración Comercial</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comisión (%)
                </label>
                <input
                  type="number"
                  name="commission_rate"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.commission_rate}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.type === 'shelter' ? 'Comisión reducida para refugios' : 'Comisión estándar'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="pending">Pendiente</option>
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                  <option value="suspended">Suspendido</option>
                </select>
              </div>
            </div>
          </div>

          {/* Términos y Notas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Términos Especiales
              </label>
              <textarea
                name="special_terms"
                rows={3}
                value={formData.special_terms}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Condiciones especiales del acuerdo..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas Internas
              </label>
              <textarea
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Notas internas sobre el comercio..."
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-end space-y-4">
          {error && (
            <div className="text-red-600 bg-red-50 px-4 py-2 rounded-lg text-sm font-medium w-full text-center">
              {error}
            </div>
          )}
          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {company ? 'Actualizar' : 'Crear'} {typeLabels[formData.type]}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};