import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Check, Shield, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface SubscriptionFormProps {
  petId: string;
  qrCodeId: string;
}

interface PlanOption {
  id: string;
  name: string;
  price: number;
  features: string[];
  recommended?: boolean;
}

const plans: PlanOption[] = [
  {
    id: 'basic',
    name: 'Básico',
    price: 500,
    features: [
      'Identificación QR básica',
      'Perfil de mascota online',
      'Contactos de emergencia',
      'Notificaciones de escaneo'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 800,
    recommended: true,
    features: [
      'Todo lo del plan Básico',
      'Historial médico completo',
      'Recordatorios de vacunación',
      'Soporte prioritario 24/7',
      'Alertas de ubicación'
    ]
  },
  {
    id: 'institutional',
    name: 'Institucional',
    price: 1200,
    features: [
      'Todo lo del plan Premium',
      'Múltiples mascotas (hasta 5)',
      'Acceso a veterinarios asociados',
      'Descuentos en productos',
      'Reportes personalizados'
    ]
  }
];

export const SubscriptionForm: React.FC<SubscriptionFormProps> = ({ petId, qrCodeId }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<string>('premium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Mock payment data - en una implementación real, esto se conectaría con un procesador de pagos
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: ''
  });

  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('Debes iniciar sesión para suscribirte');
      return;
    }
    
    if (!petId || !qrCodeId) {
      setError('Información de mascota o QR no disponible');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // En una implementación real, aquí se procesaría el pago con un servicio como Stripe o MercadoPago
      
      // Crear registro de suscripción
      const selectedPlanData = plans.find(plan => plan.id === selectedPlan);
      
      const { data: subscription, error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert([
          {
            qr_code_id: qrCodeId,
            user_id: user.id,
            plan_type: selectedPlan,
            monthly_price: selectedPlanData?.price || 500,
            commission_rate: 10.00, // Porcentaje de comisión estándar
            status: 'active',
            start_date: new Date().toISOString(),
            next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 días después
            payment_method: 'credit_card',
            payment_status: 'paid', // En una implementación real, esto dependería de la respuesta del procesador de pagos
            metadata: {
              payment_details: {
                last_four: paymentData.cardNumber.slice(-4),
                card_type: 'visa' // En una implementación real, esto se detectaría automáticamente
              }
            }
          }
        ])
        .select()
        .single();
        
      if (subscriptionError) throw subscriptionError;
      
      // Actualizar el estado del QR a activo si no lo está ya
      const { error: qrError } = await supabase
        .from('qr_codes')
        .update({ 
          status: 'active',
          activation_date: new Date().toISOString()
        })
        .eq('id', qrCodeId);
        
      if (qrError) {
        console.error('Error actualizando QR:', qrError);
        // Continuar de todos modos ya que la suscripción se creó correctamente
      }
      
      setSuccess(true);
      
      // Navegar al dashboard después de un breve retraso
      setTimeout(() => {
        navigate('/mi-cuenta');
      }, 2000);
      
    } catch (err: any) {
      console.error('Error creando suscripción:', err);
      setError(err.message || 'Error al procesar la suscripción');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-md">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Elige tu plan de protección</h2>
        <p className="mt-2 text-gray-600">
          Selecciona el plan que mejor se adapte a las necesidades de tu mascota
        </p>
      </div>

      {success ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-green-800 mb-2">¡Suscripción activada con éxito!</h3>
          <p className="text-green-700 mb-4">
            Tu mascota ahora está protegida con nuestro servicio.
          </p>
          <button
            onClick={() => navigate('/mi-cuenta')}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Ir a Mi Cuenta
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Planes de suscripción */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {plans.map((plan) => (
              <div 
                key={plan.id}
                className={`border rounded-xl p-6 transition-all ${
                  selectedPlan === plan.id 
                    ? 'border-green-500 ring-2 ring-green-500 bg-green-50' 
                    : 'border-gray-200 hover:border-green-300'
                } ${plan.recommended ? 'relative' : ''}`}
              >
                {plan.recommended && (
                  <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                    Recomendado
                  </div>
                )}
                
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold">{plan.name}</h3>
                  <input
                    type="radio"
                    name="plan"
                    value={plan.id}
                    checked={selectedPlan === plan.id}
                    onChange={() => setSelectedPlan(plan.id)}
                    className="h-5 w-5 text-green-600 focus:ring-green-500"
                  />
                </div>
                
                <div className="mb-4">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <span className="text-gray-600 ml-1">/mes</span>
                </div>
                
                <ul className="space-y-2 mb-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button
                  type="button"
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedPlan === plan.id
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-white text-green-600 border border-green-600 hover:bg-green-50'
                  }`}
                >
                  {selectedPlan === plan.id ? 'Seleccionado' : 'Seleccionar'}
                </button>
              </div>
            ))}
          </div>

          {/* Información de pago */}
          <div className="border border-gray-200 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-green-600" />
              Información de pago
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Número de tarjeta
                </label>
                <input
                  id="cardNumber"
                  name="cardNumber"
                  type="text"
                  required
                  value={paymentData.cardNumber}
                  onChange={handlePaymentChange}
                  className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="1234 5678 9012 3456"
                />
              </div>
              
              <div>
                <label htmlFor="cardName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre en la tarjeta
                </label>
                <input
                  id="cardName"
                  name="cardName"
                  type="text"
                  required
                  value={paymentData.cardName}
                  onChange={handlePaymentChange}
                  className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Juan Pérez"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de expiración
                  </label>
                  <input
                    id="expiryDate"
                    name="expiryDate"
                    type="text"
                    required
                    value={paymentData.expiryDate}
                    onChange={handlePaymentChange}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="MM/AA"
                  />
                </div>
                
                <div>
                  <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-2">
                    CVV
                  </label>
                  <input
                    id="cvv"
                    name="cvv"
                    type="text"
                    required
                    value={paymentData.cvv}
                    onChange={handlePaymentChange}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="123"
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex items-start">
              <Shield className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-600">
                Tus datos de pago están seguros. Utilizamos encriptación de grado bancario para proteger tu información.
              </p>
            </div>
          </div>

          {/* Resumen y confirmación */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Resumen de tu suscripción</h3>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Plan seleccionado:</span>
                <span className="font-medium">{plans.find(p => p.id === selectedPlan)?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Precio mensual:</span>
                <span className="font-medium">${plans.find(p => p.id === selectedPlan)?.price}/mes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Próximo cobro:</span>
                <span className="font-medium">
                  {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            <div className="flex items-start mb-4">
              <AlertCircle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-600">
                Al confirmar, aceptas que se realice un cargo mensual a tu tarjeta según el plan seleccionado. 
                Puedes cancelar tu suscripción en cualquier momento desde tu cuenta.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Procesando pago...
              </div>
            ) : (
              <div className="flex items-center">
                <CreditCard className="h-4 w-4 mr-2" />
                Confirmar suscripción
              </div>
            )}
          </button>
        </form>
      )}
    </div>
  );
};

export default SubscriptionForm;