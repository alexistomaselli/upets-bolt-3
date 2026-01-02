import React, { useState } from 'react';
import { CompanyManagement } from '../../components/companies/CompanyManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { QRAssignment } from '../../components/companies/QRAssignment';
import { Building, QrCode } from 'lucide-react';

export const CompanyPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('management');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Comercios</h1>
        <p className="text-gray-600 mt-2">
          Administra los comercios e instituciones y asigna QRs a cada uno
        </p>
      </div>

      <Tabs defaultValue="management" onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="management" className="flex items-center">
            <Building className="h-4 w-4 mr-2" />
            Comercios
          </TabsTrigger>
          <TabsTrigger value="qr-assignment" className="flex items-center">
            <QrCode className="h-4 w-4 mr-2" />
            Asignación de QRs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="management">
          <CompanyManagement />
        </TabsContent>

        <TabsContent value="qr-assignment">
          <QRAssignment />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompanyPage;