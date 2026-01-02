import React from 'react';
import { Users, Shield, BarChart3, Settings, Store, QrCode, Building } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { NavLink, Outlet } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const { profile, roles } = useAuth();

  const navigationItems = [
    { id: 'overview', label: 'Panel Principal', icon: BarChart3, path: '/admin' },
    { id: 'spets', label: 'S-Pets (Comercios)', icon: Store, path: '/admin/spets' },
    { id: 'companies', label: 'Empresas (Clientes)', icon: Building, path: '/admin/comercios' },
    { id: 'qr-management', label: 'Gestión QR', icon: QrCode, path: '/admin/qr' },
    { id: 'users', label: 'Usuarios', icon: Users, path: '/admin/usuarios' },
    { id: 'roles', label: 'Roles', icon: Shield, path: '/admin/roles' },
    { id: 'settings', label: 'Configuración', icon: Settings, path: '/admin/configuracion' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
              <p className="text-gray-600 mt-1">
                Bienvenido, {profile?.first_name} {profile?.last_name}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {roles.map((role) => (
                <span
                  key={role.role_name}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${role.role_name === 'super_admin'
                    ? 'bg-red-100 text-red-800'
                    : role.role_name === 'company_admin'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                    }`}
                >
                  {role.role_name.replace('_', ' ').toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Breadcrumb */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <nav className="flex items-center space-x-4">
            {navigationItems.map((item) => (
              <NavLink
                key={item.id}
                to={item.path}
                end={item.path === '/admin'} // Only exact match for root /admin
                className={({ isActive }) => `flex items-center px-4 py-2 rounded-lg font-medium text-sm transition-colors ${isActive
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
              >
                <item.icon className="h-4 w-4 mr-2" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="fade-in">
          <Outlet />
        </div>
      </div>
    </div>
  );
};