import React, { useState } from 'react';
import { QRList, QRGenerationForm } from '../../components/qr';

export const QRManagementPage: React.FC = () => {
    const [showQRForm, setShowQRForm] = useState(false);

    return (
        <div className="space-y-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Gestión de QRs</h1>
                <p className="text-gray-600 mt-2">
                    Genera, activa y administra los códigos QR del sistema
                </p>
            </div>

            {showQRForm ? (
                <QRGenerationForm
                    onSuccess={() => {
                        setShowQRForm(false);
                    }}
                    onCancel={() => setShowQRForm(false)}
                />
            ) : (
                <QRList
                    showActions={true}
                    onCreateNew={() => setShowQRForm(true)}
                />
            )}
        </div>
    );
};
