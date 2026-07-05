import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Users, UserPlus, PlusCircle, ChevronRight, Copy, Check, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

const GroupsPage = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados de formularios
  const [newGroupName, setNewGroupName] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  const [inviteCode, setInviteCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState('');

  // Clipboard copies
  const [copiedId, setCopiedId] = useState(null);

  const fetchGroups = async () => {
    try {
      const response = await api.get('/groups');
      setGroups(response.data);
    } catch (err) {
      console.error('Error al cargar grupos:', err);
      setError('No se pudieron cargar tus grupos de quiniela.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      setCreateError('El nombre del grupo es obligatorio');
      return;
    }

    setCreateLoading(true);
    setCreateError('');
    setCreateSuccess('');
    try {
      const response = await api.post('/groups', { nombre: newGroupName });
      setCreateSuccess(`¡Grupo "${response.data.group.nombre}" creado exitosamente!`);
      setNewGroupName('');
      fetchGroups(); // Recargar lista
    } catch (err) {
      console.error('Error al crear grupo:', err);
      setCreateError(err.response?.data?.error || 'Error al crear el grupo.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJoinGroup = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      setJoinError('El código de invitación es obligatorio');
      return;
    }

    setJoinLoading(true);
    setJoinError('');
    setJoinSuccess('');
    try {
      const response = await api.post('/groups/join', { codigo_invitacion: inviteCode });
      setJoinSuccess(`¡Te has unido al grupo "${response.data.group.nombre}" exitosamente!`);
      setInviteCode('');
      fetchGroups(); // Recargar lista
    } catch (err) {
      console.error('Error al unirse al grupo:', err);
      setJoinError(err.response?.data?.error || 'Error al unirse al grupo.');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleCopyCode = (id, code) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users color="var(--primary)" /> Mis Grupos de Quiniela
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Crea grupos privados con amigos o únete a uno existente usando su código de invitación.</p>
      </div>

      {/* Formularios: Crear y Unirse */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem'
      }}>
        {/* Crear Grupo */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PlusCircle color="var(--primary)" size={20} /> Crear Nuevo Grupo
          </h2>
          
          {createError && <div style={{ fontSize: '0.85rem', color: 'var(--danger)' }}>{createError}</div>}
          {createSuccess && <div style={{ fontSize: '0.85rem', color: 'var(--success)' }}>{createSuccess}</div>}

          <form onSubmit={handleCreateGroup} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Nombre del Grupo</label>
              <input 
                type="text" 
                placeholder="Ej: Amigos del Fútbol" 
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                disabled={createLoading}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={createLoading}>
              {createLoading ? 'Creando...' : 'Crear Grupo'}
            </button>
          </form>
        </div>

        {/* Unirse a Grupo */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserPlus color="var(--primary)" size={20} /> Unirse a Grupo Privado
          </h2>

          {joinError && <div style={{ fontSize: '0.85rem', color: 'var(--danger)' }}>{joinError}</div>}
          {joinSuccess && <div style={{ fontSize: '0.85rem', color: 'var(--success)' }}>{joinSuccess}</div>}

          <form onSubmit={handleJoinGroup} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Código de Invitación</label>
              <input 
                type="text" 
                placeholder="Ej: ABC123D4" 
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                disabled={joinLoading}
                required
              />
            </div>
            <button type="submit" className="btn btn-success" style={{ width: '100%' }} disabled={joinLoading}>
              {joinLoading ? 'Uniéndose...' : 'Unirse al Grupo'}
            </button>
          </form>
        </div>
      </div>

      {/* Lista de Grupos Activos */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={20} color="var(--primary)" /> Grupos a los que perteneces ({groups.length})
        </h2>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Cargando grupos...
          </div>
        ) : error ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)' }}>{error}</div>
        ) : groups.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
            Aún no eres miembro de ningún grupo. Utiliza los paneles superiores para crear o unirte a uno.
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem'
          }}>
            {groups.map((group) => (
              <div 
                key={group.id} 
                className="glass-panel" 
                style={{ 
                  padding: '1.25rem', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '1rem',
                  background: 'rgba(255,255,255,0.015)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{group.nombre}</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Creado por: {group.creador_nombre}
                    </span>
                  </div>
                  <span className={`badge ${group.posicion === 1 ? 'badge-warning' : 'badge-info'}`}>
                    Posición #{group.posicion || 1}
                  </span>
                </div>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  background: 'rgba(255,255,255,0.02)',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem'
                }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Código de Invitación</span>
                    <strong style={{ fontFamily: 'monospace', fontSize: '1rem', letterSpacing: '0.05em' }}>{group.codigo_invitacion}</strong>
                  </div>
                  <button 
                    onClick={() => handleCopyCode(group.id, group.codigo_invitacion)} 
                    className="btn btn-secondary" 
                    style={{ padding: '0.4rem', borderRadius: '6px' }}
                  >
                    {copiedId === group.id ? <Check size={16} color="var(--success)" /> : <Copy size={16} />}
                  </button>
                </div>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  borderTop: '1px solid var(--border-glass)',
                  paddingTop: '0.75rem'
                }}>
                  <span>{group.total_participantes} participantes</span>
                  <span>{group.puntos_totales || 0} puntos obtenidos</span>
                </div>

                <Link 
                  to={`/groups/${group.id}`} 
                  className="btn btn-primary" 
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px' }}
                >
                  Ver Clasificación y Miembros <ChevronRight size={16} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupsPage;
