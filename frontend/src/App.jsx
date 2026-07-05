import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Importar Componentes
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Importar Páginas
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CalendarPage from './pages/Calendar';
import GroupsPage from './pages/Groups';
import GroupDetailPage from './pages/GroupDetail';
import ProfilePage from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import MapSedes from './components/MapSedes';

// Ruta Protegida
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="loader" style={{
          width: '40px',
          height: '40px',
          border: '4px solid rgba(255, 255, 255, 0.1)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user.rol !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Barra de navegación superior */}
      <Navbar onToggleSidebar={toggleSidebar} />

      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        {/* Barra lateral de navegación */}
        <Sidebar isOpen={sidebarOpen} />

        {/* Contenedor de contenido principal */}
        <main style={{
          flex: 1,
          marginLeft: sidebarOpen ? 'var(--sidebar-width)' : 0,
          padding: '2rem',
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          minWidth: 0 // Evita desbordamiento en grids CSS
        }}>
          <Routes>
            {/* Rutas Públicas de Auth */}
            <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
            <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />

            {/* Rutas Públicas de Información */}
            <Route path="/sedes" element={<MapSedes />} />
            <Route path="/calendar" element={<CalendarPage />} />

            {/* Rutas Privadas del Usuario */}
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/groups" element={
              <ProtectedRoute>
                <GroupsPage />
              </ProtectedRoute>
            } />
            <Route path="/groups/:id" element={
              <ProtectedRoute>
                <GroupDetailPage />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />

            {/* Rutas Privadas del Administrador */}
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminDashboard />
              </ProtectedRoute>
            } />

            {/* Redirección por defecto */}
            <Route path="*" element={<Navigate to={user ? "/" : "/calendar"} replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
