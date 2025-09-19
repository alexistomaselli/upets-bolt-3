import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QrCode, Phone, MessageCircle, MapPin, Calendar, AlertTriangle, Heart, UserPlus } from 'lucide-react';
import { useQRCodeByCode, useRecordQRScan } from '../hooks/qr/useQRCodes';
import { LoadingSpinner } from '../components/ui';

export const QRScanPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const { data: qrCode, isLoading, error } = useQRCodeByCode(code || '');
  const recordScanMutation = useRecordQRScan();
  const [scanRecorded, setScanRecorded] = useState(false);

  useEffect(() => {
    // Registrar el escaneo automáticamente cuando se carga la página
    if (qrCode && !scanRecorded) {
      recordScan();
    }
  }, [qrCode, scanRecorded]);

  const recordScan = async () => {
    if (!qrCode || scanRecorded) return;

    try {
      await recordScanMutation.mutateAsync({
        qr_code_id: qrCode.id,
        scanner_ip: await getClientIP(),
        scanner_user_agent: navigator.userAgent,
        scan_location: await getCurrentLocation(),
        contact_made: false,
        notes: 'Escaneo desde página pública'
      });
      setScanRecorded(true);
    } catch (error) {
      console.error('Error recording scan:', error);
    }
  };

  const getClientIP = async (): Promise<string | null> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return null;
    }
  };

  const getCurrentLocation = async (): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            // Aquí podrías usar reverse geocoding para obtener la dirección
            resolve(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          } catch {
            resolve(null);
          }
        },
        () => resolve(null),
        { timeout: 5000 }
      );
    });
  };

  const handleContactOwner = async (method: 'phone' | 'whatsapp') => {
    if (!qrCode?.owner_id) return;

    // Actualizar que se hizo contacto
    try {
      await recordScanMutation.mutateAsync({
        qr_code_id: qrCode.id,
        contact_made: true,
        notes: `Contacto realizado vía ${method}`
      });
    } catch (error) {
      console.error('Error updating contact:', error);
    }

    // Abrir contacto
    if (method === 'phone' && qrCode.owner?.phone) {
      window.open(`tel:${qrCode.owner.phone}`);
    } else if (method === 'whatsapp' && qrCode.owner?.whatsapp) {
      const message = encodeURIComponent(`Hola! Encontré a ${qrCode.pet?.name || 'tu mascota'}. Escaneé su QR de AFPets.`);
      window.open(`https://wa.me/${qrCode.owner.whatsapp.replace(/[^0-9]/g, '')}?text=${message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="xl" className="mx-auto mb-4" />
          <p className="text-gray-600">Cargando información del QR...</p>
        </div>
      </div>
    );
  }

  if (error || !qrCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">QR No Encontrado</h1>
            <p className="text-gray-600 mb-6">
              El código QR que escaneaste no existe o no está disponible.
            </p>
            <Link
              to="/"
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
            >
              Ir a AFPets
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // QR Inactivo - Redirigir a registro
  if (qrCode.status === 'inactive') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <QrCode className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">QR Sin Activar</h1>
            <p className="text-gray-600 mb-6">
              Este QR aún no ha sido activado por su dueño. Si eres el dueño de este QR, 
              puedes activarlo registrándote en AFPets.
            </p>
            
            <div className="space-y-4">
              <Link
                to="/registro"
                className="w-full inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors"
              >
                <UserPlus className="mr-2 h-5 w-5" />
                Registrarme y Activar QR
              </Link>
              
              <Link
                to="/"
                className="w-full inline-flex items-center justify-center px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
              >
                Conocer AFPets
              </Link>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>¿No eres el dueño?</strong> Este QR pertenece a AFPets. 
                Contacta con nosotros si encontraste una mascota.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // QR Activo - Mostrar información de contacto
  if (qrCode.status === 'active' && qrCode.pet_id && qrCode.owner_id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-blue-600 p-6 text-white text-center">
              <Heart className="h-12 w-12 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">¡Mascota Encontrada!</h1>
              <p className="text-green-100">Información de contacto del dueño</p>
            </div>

            {/* Pet Info */}
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4 border-4 border-green-100 flex items-center justify-center">
                  <Heart className="h-12 w-12 text-gray-400" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Mascota de AFPets</h2>
                <div className="flex items-center justify-center space-x-4 text-gray-600">
                  <span>Información cargando...</span>
                </div>
              </div>

              {/* Owner Contact */}
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                  Contactar al Dueño
                </h3>
                
                <div className="text-center mb-6">
                  <p className="text-xl font-semibold text-gray-900">
                    Información del dueño
                  </p>
                  <p className="text-gray-600">Cargando datos...</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => handleContactOwner('phone')}
                    className="flex items-center justify-center px-6 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    <Phone className="mr-2 h-5 w-5" />
                    Llamar
                  </button>
                  
                  <button
                    onClick={() => handleContactOwner('whatsapp')}
                    className="flex items-center justify-center px-6 py-4 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors"
                  >
                    <MessageCircle className="mr-2 h-5 w-5" />
                    WhatsApp
                  </button>
                </div>
              </div>

              {/* AFPets Branding */}
              <div className="text-center border-t border-gray-200 pt-6">
                <Link to="/" className="inline-flex items-center text-green-600 hover:text-green-700 font-medium">
                  <img src="/afpets-7.webp" alt="AFPets" className="h-6 w-6 mr-2" />
                  Protegido por AFPets
                </Link>
                <p className="text-xs text-gray-500 mt-2">
                  Sistema de identificación inteligente para mascotas
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // QR Perdido
  if (qrCode.status === 'lost') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-pink-600 p-6 text-white text-center">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">🚨 MASCOTA PERDIDA 🚨</h1>
              <p className="text-red-100">Por favor ayuda a reunir esta familia</p>
            </div>

            <div className="p-8">
              <div className="text-center mb-8">
                <div className="w-40 h-40 bg-gray-200 rounded-full mx-auto mb-4 border-4 border-red-200 flex items-center justify-center">
                  <Heart className="h-16 w-16 text-gray-400" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Mascota Perdida</h2>
                <div className="text-lg text-gray-600 mb-4">
                  Información cargando...
                </div>
                
                <div className="bg-red-100 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-800 font-semibold">
                    ¡Esta mascota está perdida! Su familia la está buscando.
                  </p>
                </div>
              </div>

              {/* Urgent Contact */}
              <div className="bg-red-50 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-red-800 mb-4 text-center">
                  🆘 CONTACTO URGENTE
                </h3>
                
                <div className="text-center mb-6">
                  <p className="text-xl font-semibold text-gray-900">
                    Dueño de la mascota
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => handleContactOwner('phone')}
                    className="flex items-center justify-center px-6 py-4 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors"
                  >
                    <Phone className="mr-2 h-5 w-5" />
                    Llamar AHORA
                  </button>
                  
                  <button
                    onClick={() => handleContactOwner('whatsapp')}
                    className="flex items-center justify-center px-6 py-4 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors"
                  >
                    <MessageCircle className="mr-2 h-5 w-5" />
                    WhatsApp
                  </button>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">📋 ¿Qué hacer ahora?</h3>
                <ol className="list-decimal list-inside space-y-2 text-blue-700">
                  <li>Contacta inmediatamente al dueño usando los botones de arriba</li>
                  <li>Si la mascota está herida, llévala al veterinario más cercano</li>
                  <li>Mantén a la mascota en un lugar seguro hasta que llegue el dueño</li>
                  <li>Si no puedes contactar al dueño, contacta a AFPets</li>
                </ol>
              </div>

              {/* AFPets Contact */}
              <div className="text-center border-t border-gray-200 pt-6 mt-6">
                <Link to="/" className="inline-flex items-center text-green-600 hover:text-green-700 font-medium mb-2">
                  <img src="/afpets-7.webp" alt="AFPets" className="h-6 w-6 mr-2" />
                  AFPets - Sistema de Identificación
                </Link>
                <p className="text-xs text-gray-500">
                  ¿Problemas para contactar? WhatsApp: +54 9 11 2345-6789
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // QR Encontrado
  if (qrCode.status === 'found') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <Heart className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">¡Mascota Encontrada!</h1>
            <p className="text-gray-600 mb-6">
              ¡Excelente noticia! Esta mascota ya fue encontrada y está de vuelta con su familia.
            </p>
            
            <div className="bg-green-100 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800">
                Gracias por escanear el QR. El sistema de AFPets funcionó correctamente.
              </p>
            </div>

            <Link
              to="/"
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
            >
              Conocer AFPets
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Estado por defecto
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center p-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <QrCode className="h-16 w-16 text-gray-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">QR de AFPets</h1>
          <p className="text-gray-600 mb-6">
            Este QR pertenece al sistema AFPets pero no está disponible en este momento.
          </p>
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
          >
            Ir a AFPets
          </Link>
        </div>
      </div>
    );
  }
};
};