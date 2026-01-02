import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { PetRegistrationForm } from '../components/pets';

export const PetRegistrationPage: React.FC = () => {
  const { qrCode } = useParams();
  const [searchParams] = useSearchParams();
  const qrCodeId = searchParams.get('qrId');

  return (
    <div className="container mx-auto py-10 px-4">
      <PetRegistrationForm qrCodeId={qrCodeId || undefined} />
    </div>
  );
};

export default PetRegistrationPage;