import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Calendar, Users, MapPin, User, Settings, LogOut } from 'lucide-react';

const Sidebar = ({ isOpen }) => {
  const { user, logout } = useAuth();

  if (!isOpen) return null;

  return (
    <aside className="glass-panel" style={{
      width: 'var(--sidebar-width)',
      height: 'calc(100vh - var(--navbar-height))',
      position: 'fixed',
      top: 'var(--navbar-height)',
      left: 0,
      borderRadius: '0 16px 0 0',
      borderLeft: 'none',
      borderTop: 'none',
      borderBottom: 'none',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '1.5rem 1rem',
      zIndex: 90,
      animation: 'fadeIn 0.3s ease'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <p style={{ 
          fontSize: '0.75rem', 
          fontWeight: 600, 
          color: 'var(--text-muted)', 
          textTransform: 'uppercase', 
          letterSpacing: '0.1em',
          paddingLeft: '0.75rem',
          marginBottom: '0.5rem'
        }}>
          Menú Principal
        </p>
        
        {user && (
          <NavLink 
            to="/" 
            end
            className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', width: '100%' }}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </NavLink>
        )}

        <NavLink 
          to="/calendar" 
          className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
          style={{ justifyContent: 'flex-start', width: '100%' }}
        >
          <Calendar size={18} />
          Calendario
        </NavLink>

        {user && (
          <NavLink 
            to="/groups" 
            className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', width: '100%' }}
          >
            <Users size={18} />
            Mis Grupos
          </NavLink>
        )}

        <NavLink 
          to="/sedes" 
          className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
          style={{ justifyContent: 'flex-start', width: '100%' }}
        >
          <MapPin size={18} />
          Sedes Oficiales
        </NavLink>

        {user && (
          <NavLink 
            to="/profile" 
            className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', width: '100%' }}
          >
            <User size={18} />
            Mi Perfil
          </NavLink>
        )}

        {/* Sección de administración si el rol es ADMIN */}
        {user && user.rol === 'ADMIN' && (
          <>
            <div style={{ margin: '1rem 0 0.5rem 0', height: '1px', background: 'var(--border-glass)' }} />
            <p style={{ 
              fontSize: '0.75rem', 
              fontWeight: 600, 
              color: 'var(--text-muted)', 
              textTransform: 'uppercase', 
              letterSpacing: '0.1em',
              paddingLeft: '0.75rem',
              marginBottom: '0.5rem'
            }}>
              Administración
            </p>
            <NavLink 
              to="/admin" 
              className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', width: '100%' }}
            >
              <Settings size={18} />
              Gestión Partidos
            </NavLink>
          </>
        )}
      </div>

      {user && (
        <button 
          onClick={logout} 
          className="btn btn-secondary" 
          style={{ justifyContent: 'flex-start', width: '100%', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
        >
          <LogOut size={18} />
          Cerrar Sesión
        </button>
      )}
    </aside>
  );
};

export default Sidebar;
