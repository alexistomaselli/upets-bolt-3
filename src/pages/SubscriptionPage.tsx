import React from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { SubscriptionForm } from '../components/subscriptions/SubscriptionForm';

export const SubscriptionPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const petId = searchParams.get('petId');
  const qrCodeId = searchParams.get('qrId');

  if (!petId || !qrCodeId) {
    return (
      <div className="container mx-auto py-10 px-4 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Información incompleta</h2>
        <p className="mb-6">No se ha proporcionado la información necesaria para la suscripción.</p>
        <button 
          onClick={() => navigate('/mi-cuenta')}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Volver a mi cuenta
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <SubscriptionForm petId={petId} qrCodeId={qrCodeId} />
    </div>
  );
};

export default SubscriptionPage;