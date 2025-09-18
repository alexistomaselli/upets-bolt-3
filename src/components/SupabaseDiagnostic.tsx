import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Database, Key, Wifi } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const SupabaseDiagnostic: React.FC = () => {
  const [tests, setTests] = useState({
    connection: { status: 'testing', message: 'Probando conexión...' },
    auth: { status: 'testing', message: 'Probando autenticación...' },
    database: { status: 'testing', message: 'Probando base de datos...' },
    rpc: { status: 'testing', message: 'Probando funciones RPC...' }
  });

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    // Test 1: Conexión básica
    try {
      if (!supabase) {
        setTests(prev => ({
          ...prev,
          connection: { status: 'error', message: 'Supabase no configurado - variables de entorno faltantes' }
        }));
        return;
      }

      const { data, error } = await supabase.from('roles').select('count').limit(1);
      setTests(prev => ({
        ...prev,
        connection: { status: 'success', message: 'Conexión exitosa' }
      }));
    } catch (error) {
      setTests(prev => ({
        ...prev,
        connection: { status: 'error', message: `Error de conexión: ${error.message}` }
      }));
    }

    // Test 2: Autenticación
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setTests(prev => ({
        ...prev,
        auth: { status: user ? 'success' : 'warning', message: user ? `Usuario: ${user.email}` : 'Sin usuario autenticado' }
      }));
    } catch (error) {
      setTests(prev => ({
        ...prev,
        auth: { status: 'error', message: `Error de auth: ${error.message}` }
      }));
    }

    // Test 3: Base de datos
    try {
      const { data, error } = await supabase.from('user_profiles').select('count').limit(1);
      setTests(prev => ({
        ...prev,
        database: { status: error ? 'error' : 'success', message: error ? `Error DB: ${error.message}` : 'Base de datos accesible' }
      }));
    } catch (error) {
      setTests(prev => ({
        ...prev,
        database: { status: 'error', message: `Error DB: ${error.message}` }
      }));
    }

    // Test 4: Función RPC
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase.rpc('get_user_roles', { user_uuid: user.id });
        setTests(prev => ({
          ...prev,
          rpc: { status: error ? 'error' : 'success', message: error ? `Error RPC: ${error.message}` : `Roles: ${data?.length || 0}` }
        }));
      } else {
        setTests(prev => ({
          ...prev,
          rpc: { status: 'warning', message: 'Sin usuario para probar RPC' }
        }));
      }
    } catch (error) {
      setTests(prev => ({
        ...prev,
        rpc: { status: 'error', message: `Error RPC: ${error.message}` }
      }));
    }
  };

  const getIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning': return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default: return <Wifi className="h-5 w-5 text-gray-400 animate-spin" />;
    }
  };

  return (
    <div className="fixed top-20 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <h3 className="font-bold text-gray-900 mb-3 flex items-center">
        <Database className="h-4 w-4 mr-2" />
        Diagnóstico Supabase
      </h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span>Conexión:</span>
          <div className="flex items-center">
            {getIcon(tests.connection.status)}
            <span className="ml-1 text-xs">{tests.connection.message}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span>Auth:</span>
          <div className="flex items-center">
            {getIcon(tests.auth.status)}
            <span className="ml-1 text-xs">{tests.auth.message}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span>Database:</span>
          <div className="flex items-center">
            {getIcon(tests.database.status)}
            <span className="ml-1 text-xs">{tests.database.message}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span>RPC:</span>
          <div className="flex items-center">
            {getIcon(tests.rpc.status)}
            <span className="ml-1 text-xs">{tests.rpc.message}</span>
          </div>
        </div>
      </div>
      
      <button 
        onClick={runDiagnostics}
        className="mt-3 w-full px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
      >
        Volver a probar
      </button>
    </div>
  );
};