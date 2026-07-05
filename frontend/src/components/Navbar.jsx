import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Trophy, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const displayName = user?.nombre || user?.name || 'Usuario';
  const initials = displayName.charAt(0).toUpperCase();
  const roleLabel = user?.rol === 'ADMIN' || user?.role === 'ADMIN' || user?.rol_nombre === 'ADMIN'
    ? 'Administrador'
    : 'Participante';

  return (
    <nav className="glass-panel" style={{
      height: 'var(--navbar-height)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
      borderRadius: '0 0 16px 16px',
      borderTop: 'none',
      borderLeft: 'none',
      borderRight: 'none',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      width: '100%'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button 
          className="btn btn-secondary" 
          onClick={onToggleSidebar}
          style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Menu size={20} />
        </button>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'inherit' }}>
          <Trophy size={28} color="var(--primary)" />
          <span style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-title)', letterSpacing: '-0.02em' }}>
            QUINIELA<span style={{ color: 'var(--primary)' }}>2026</span>
          </span>
        </Link>
      </div>

      {user ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'inherit' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1rem',
              color: 'white',
              boxShadow: '0 2px 10px rgba(99, 102, 241, 0.3)'
            }}>
              {initials}
            </div>
            <div style={{ display: 'none', md: 'block' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{displayName}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{roleLabel}</div>
            </div>
          </Link>
          <button onClick={logout} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            <LogOut size={16} />
            <span style={{ display: 'none', md: 'inline' }}>Salir</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/login" className="btn btn-secondary">Iniciar Sesión</Link>
          <Link to="/register" className="btn btn-primary">Registrarse</Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
