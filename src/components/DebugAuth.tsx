import React from 'react';
import { useAuth } from '../hooks/useAuth';

export const DebugAuth: React.FC = () => {
  const { user, profile, roles, loading } = useAuth();

  // Solo mostrar en desarrollo y si hay problemas
  if (process.env.NODE_ENV === 'production' || (!loading && user)) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-90 text-white p-3 rounded-lg text-xs max-w-xs z-50 shadow-xl opacity-75">
      <h4 className="font-bold mb-2">🐛 Debug Auth</h4>
      <div className="space-y-1">
        <p><strong>User:</strong> {user ? user.email : 'No autenticado'}</p>
        <p><strong>Loading:</strong> {loading ? 'Sí' : 'No'}</p>
        <p><strong>Profile:</strong> {profile ? `${profile.first_name} ${profile.last_name}` : 'No cargado'}</p>
        <p><strong>Roles:</strong> {roles.length}</p>
        {roles.length > 0 ? (
          <ul className="ml-2 text-xs">
            {roles.map((role, i) => (
              <li key={i}>• {role.role_name} (nivel {role.role_level})</li>
            ))}
          </ul>
        ) : (
          <p className="ml-2 text-yellow-300 text-xs">Sin roles</p>
        )}
        <p><strong>Supabase:</strong> {import.meta.env.VITE_SUPABASE_URL ? '✅' : '❌'}</p>
      </div>
    </div>
  );
};