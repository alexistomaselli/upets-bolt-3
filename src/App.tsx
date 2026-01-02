import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from './hooks/useAuth';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { SEOStructuredData } from './components/SEOStructuredData';
import { SocialMetaTags } from './components/SocialMetaTags';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginForm, RegisterForm, ForgotPasswordForm } from './components/auth';
import { LandingPage } from './pages/LandingPage';
import { StorePage } from './pages/StorePage';
import { ProductPage } from './pages/ProductPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { WhatsAppPage } from './pages/WhatsAppPage';
import { RoadmapPage } from './pages/RoadmapPage';
import { QRScanPage } from './pages/QRScanPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminOverview } from './pages/admin/AdminOverview';
import { QRManagementPage } from './pages/admin/QRManagementPage';
import { CompanyPage } from './pages/admin/CompanyPage';
import { CustomerDashboard } from './pages/CustomerDashboard';
import { PetRegistrationPage } from './pages/PetRegistrationPage';
import { SubscriptionPage } from './pages/SubscriptionPage';
import { DebugAuth } from './components/DebugAuth';
import { SupabaseDiagnostic } from './components/SupabaseDiagnostic';

const queryClient = new QueryClient();

// Componente para manejar los datos estructurados según la ruta
const SEOHandler = () => {
  const location = useLocation();
  const path = location.pathname;

  // Determinar el tipo de datos estructurados según la ruta
  let type: 'website' | 'product' | 'service' | 'organization' = 'website';

  if (path === '/') {
    type = 'organization';
  } else if (path.includes('/tienda') || path.includes('/producto')) {
    type = 'service';
  }

  return <SEOStructuredData type={type} path={path} />;
};

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AppContent isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
      </Router>
    </QueryClientProvider>
  );
}

// Componente interno que tiene acceso al contexto del Router
const AppContent = ({ isMenuOpen, setIsMenuOpen }: { isMenuOpen: boolean, setIsMenuOpen: (isOpen: boolean) => void }) => {
  const location = useLocation();
  const { user, loading, isSuperAdmin, isCompanyAdmin, isBranchAdmin } = useAuth();
  const path = location.pathname;

  // Rutas que no necesitan header/footer
  const authRoutes = ['/login', '/registro', '/recuperar-password'];
  const isAuthRoute = authRoutes.includes(path);

  // Configurar metadatos específicos según la ruta
  let title = 'AFPets - Bienestar y Seguridad para tu Mascota | QR para Mascotas';
  let description = 'Protege a tu mascota con nuestro QR inteligente y consulta a nuestro veterinario IA por WhatsApp. Conectando humanos y mascotas para su bienestar y seguridad.';
  let type: 'website' | 'article' | 'product' = 'website';

  if (path === '/') {
    title = 'AFPets - Bienestar y Seguridad para tu Mascota | QR para Mascotas';
    description = 'Conectamos humanos y mascotas para su bienestar. QR inteligente para identificación y veterinario IA por WhatsApp.';
  } else if (path.includes('/tienda')) {
    title = 'Tienda AFPets | QR para Mascotas y Servicios Veterinarios';
    description = 'Adquiere nuestro QR inteligente para la seguridad de tu mascota y accede a servicios veterinarios por IA.';
    type = 'product';
  } else if (path.includes('/whatsapp')) {
    title = 'Veterinario IA por WhatsApp | Consultas 24/7 | AFPets';
    description = 'Consulta a nuestro veterinario con inteligencia artificial por WhatsApp las 24 horas. Respuestas inmediatas sobre síntomas, alimentación y cuidados básicos.';
    type = 'article';
  }

  return (
    <div className="min-h-screen bg-white">
      <SEOHandler />
      <SocialMetaTags
        title={title}
        description={description}
        url={`https://afpets.com${path}`}
        type={type}
      />

      {!isAuthRoute && <Header isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />}

      <main className={!isAuthRoute ? "pt-16" : ""}>
        {/* Debug component - solo en desarrollo */}
        {process.env.NODE_ENV === 'development' && <DebugAuth />}

        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/tienda" element={<StorePage />} />
          <Route path="/producto/:slug" element={<ProductPage />} />
          <Route path="/whatsapp" element={<WhatsAppPage />} />
          <Route path="/roadmap" element={<RoadmapPage />} />

          {/* Página pública de escaneo QR */}
          <Route path="/qr/:code" element={<QRScanPage />} />

          {/* Rutas de autenticación */}
          <Route path="/login" element={<LoginForm />} />
          <Route path="/recuperar-password" element={<ForgotPasswordForm />} />
          <Route path="/registro" element={<RegisterForm />} />

          {/* Rutas de registro de mascotas y suscripciones */}
          <Route path="/registrar-mascota" element={
            <ProtectedRoute>
              <PetRegistrationPage />
            </ProtectedRoute>
          } />
          <Route path="/suscripcion" element={
            <ProtectedRoute>
              <SubscriptionPage />
            </ProtectedRoute>
          } />

          {/* Rutas protegidas */}
          <Route path="/carrito" element={
            <CartPage />
          } />
          <Route path="/checkout" element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          } />
          <Route path="/mi-cuenta" element={
            <ProtectedRoute>
              {loading ? (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando tu cuenta...</p>
                  </div>
                </div>
              ) : (
                user && (isSuperAdmin() || isCompanyAdmin() || isBranchAdmin()) ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <CustomerDashboard />
                )
              )}
            </ProtectedRoute>
          } />

          {/* Rutas de administración */}
          <Route path="/admin" element={
            <ProtectedRoute minimumLevel={10}>
              <AdminDashboard />
            </ProtectedRoute>
          }>
            <Route index element={<AdminOverview />} />
            <Route path="comercios" element={<CompanyPage />} />
            <Route path="spets" element={<CompanyPage />} />
            <Route path="qr" element={<QRManagementPage />} />

            {/* Placeholders for future routes */}
            <Route path="usuarios" element={<div className="bg-white p-8 rounded shadow text-center"><h2>Gestión de Usuarios (En Construcción)</h2></div>} />
            <Route path="roles" element={<div className="bg-white p-8 rounded shadow text-center"><h2>Roles (En Construcción)</h2></div>} />
            <Route path="configuracion" element={<div className="bg-white p-8 rounded shadow text-center"><h2>Configuración (En Construcción)</h2></div>} />
          </Route>
        </Routes>
      </main>

      {!isAuthRoute && <Footer />}

      {/* Diagnóstico de Supabase - solo en desarrollo */}
      {/*process.env.NODE_ENV === 'development' && <SupabaseDiagnostic />*/}
    </div>
  );
};

export default App;