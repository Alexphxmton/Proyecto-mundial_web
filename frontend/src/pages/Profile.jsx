import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { User, Mail, Lock, CheckCircle2, ShieldAlert } from 'lucide-react';

const ProfilePage = () => {
  const { user, updateUserProfile } = useAuth();
  
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setNombre(user.nombre);
      setEmail(user.email);
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!nombre.trim() || !email.trim()) {
      setError('El nombre y el correo electrónico son obligatorios');
      return;
    }

    if (password) {
      if (password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres');
        return;
      }
      if (password !== confirmPassword) {
        setError('Las contraseñas no coinciden');
        return;
      }
    }

    setLoading(true);
    try {
      const response = await api.put('/users/profile', {
        nombre,
        email,
        password: password || undefined,
      });

      // Actualizar el perfil en el contexto de autenticación
      updateUserProfile(response.data.user);
      
      setSuccess('Perfil actualizado exitosamente');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Error al actualizar el perfil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User color="var(--primary)" /> Mi Perfil de Usuario
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Consulta o modifica tus datos personales e inicia un cambio de contraseña.</p>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid var(--danger)',
            color: '#f87171',
            padding: '0.75rem',
            borderRadius: '10px',
            fontSize: '0.85rem',
            textAlign: 'center'
          }}>
            <ShieldAlert size={16} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} /> {error}
          </div>
        )}

        {success && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid var(--success)',
            color: '#34d399',
            padding: '0.75rem',
            borderRadius: '10px',
            fontSize: '0.85rem',
            textAlign: 'center'
          }}>
            <CheckCircle2 size={16} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} /> {success}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Nombre */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Nombre Completo</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Email */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Correo Electrónico</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div style={{ margin: '1rem 0 0.5rem 0', height: '1px', background: 'var(--border-glass)' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)' }}>Cambiar Contraseña</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Dejar en blanco si no deseas cambiar tu contraseña.</p>

          {/* Contraseña Nueva */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Nueva Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                disabled={loading}
              />
            </div>
          </div>

          {/* Confirmar Contraseña Nueva */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Confirmar Nueva Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                placeholder="Repite la contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                disabled={loading}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem' }} disabled={loading}>
            {loading ? 'Guardando cambios...' : 'Guardar Cambios'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
