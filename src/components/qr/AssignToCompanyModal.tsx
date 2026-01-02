
import React, { useState } from 'react';
import { X, Store, Check } from 'lucide-react';
import { useCompanies } from '../../hooks/companies/useCompanies';
import { useAssignToCompany } from '../../hooks/qr/useQRCodes';
import { Button } from '../ui';

interface AssignToCompanyModalProps {
    isOpen: boolean;
    onClose: () => void;
    qrIds: string[];
    onSuccess: () => void;
}

export const AssignToCompanyModal: React.FC<AssignToCompanyModalProps> = ({
    isOpen,
    onClose,
    qrIds,
    onSuccess,
}) => {
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
    const [notes, setNotes] = useState('');

    const { data: companies, isLoading: isLoadingCompanies } = useCompanies();
    const assignMutation = useAssignToCompany();

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCompanyId) return;

        try {
            await assignMutation.mutateAsync({
                qr_ids: qrIds,
                company_id: selectedCompanyId,
                notes: notes
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error assigning QRs:', error);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

                <div className="inline-block px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                    <div className="absolute top-0 right-0 pt-4 pr-4">
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-500 focus:outline-none"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="sm:flex sm:items-start">
                        <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 mx-auto bg-blue-100 rounded-full sm:mx-0 sm:h-10 sm:w-10">
                            <Store className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                            <h3 className="text-lg font-medium leading-6 text-gray-900">
                                Asignar QRs a S-Pet
                            </h3>
                            <div className="mt-2">
                                <p className="text-sm text-gray-500">
                                    Estás a punto de asignar <span className="font-bold text-gray-900">{qrIds.length}</span> códigos QR a un comercio.
                                    Estos QRs quedarán disponibles en el inventario del comercio seleccionado.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                                <div>
                                    <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                                        Seleccionar Comercio
                                    </label>
                                    <select
                                        id="company"
                                        required
                                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                        value={selectedCompanyId}
                                        onChange={(e) => setSelectedCompanyId(e.target.value)}
                                        disabled={isLoadingCompanies}
                                    >
                                        <option value="">Selecciona un comercio...</option>
                                        {companies?.map((company) => (
                                            <option key={company.id} value={company.id}>
                                                {company.name} ({company.city})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                                        Notas de asignación (opcional)
                                    </label>
                                    <textarea
                                        id="notes"
                                        rows={3}
                                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md"
                                        placeholder="Detalles sobre entregas, lote, etc..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    />
                                </div>

                                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                    <Button
                                        type="submit"
                                        disabled={!selectedCompanyId || assignMutation.isPending}
                                        loading={assignMutation.isPending}
                                        icon={<Check className="w-4 h-4" />}
                                    >
                                        Confirmar Asignación
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={onClose}
                                        className="mt-3 w-full sm:mt-0 sm:w-auto sm:mr-3"
                                    >
                                        Cancelar
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
