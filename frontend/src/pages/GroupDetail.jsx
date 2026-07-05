import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Users, Trophy, Copy, Check, Calendar, CalendarDays, Award } from 'lucide-react';

const GroupDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const fetchGroupDetails = async () => {
    try {
      const response = await api.get(`/groups/${id}`);
      setData(response.data);
    } catch (err) {
      console.error('Error al cargar detalle del grupo:', err);
      setError(err.response?.data?.error || 'No se pudo cargar el detalle del grupo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupDetails();
  }, [id]);

  const handleCopyCode = () => {
    if (data && data.group) {
      navigator.clipboard.writeText(data.group.codigo_invitacion);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', gap: '1rem' }}>
        <div className="loader" style={{
          width: '40px',
          height: '40px',
          border: '4px solid rgba(255, 255, 255, 0.1)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ color: 'var(--text-secondary)' }}>Cargando tabla de clasificación...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', borderLeft: '4px solid var(--danger)' }}>
        <h2 style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>Acceso Denegado</h2>
        <p>{error}</p>
        <div style={{ marginTop: '1.5rem' }}>
          <Link to="/groups" className="btn btn-secondary">
            <ArrowLeft size={16} /> Volver a Mis Grupos
          </Link>
        </div>
      </div>
    );
  }

  const { group, ranking, participants } = data;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Botón de volver */}
      <div>
        <Link to="/groups" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Volver a mis grupos
        </Link>
      </div>

      {/* Header del Grupo */}
      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(17, 24, 39, 0.8))' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{group.nombre}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Grupo privado creado por <strong>{group.creador_nombre}</strong> el {new Date(group.fecha_creacion).toLocaleDateString()}
          </p>
        </div>

        {/* Código de invitación */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--border-glass)',
          borderRadius: '12px',
          padding: '0.75rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>Código para invitar amigos</span>
            <strong style={{ fontSize: '1.15rem', fontFamily: 'monospace', color: 'white', letterSpacing: '0.05em' }}>{group.codigo_invitacion}</strong>
          </div>
          <button onClick={handleCopyCode} className="btn btn-primary" style={{ padding: '0.5rem', borderRadius: '8px' }}>
            {copied ? <Check size={18} /> : <Copy size={18} />}
          </button>
        </div>
      </div>

      {/* Cuerpo: Clasificación a la izquierda, Participantes a la derecha */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '2rem'
      }}>
        {/* Clasificación (Quiniela Ranking) */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Trophy size={20} color="var(--warning)" /> Clasificación de la Quiniela
          </h2>

          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Puesto</th>
                  <th>Participante</th>
                  <th>Puntos Totales</th>
                  <th style={{ textAlign: 'right' }}>Estatus</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((item, idx) => {
                  const isCurrentUser = item.usuario_id === user.id;
                  const isLeader = item.posicion === 1 && item.puntos_totales > 0;

                  return (
                    <tr 
                      key={item.usuario_id} 
                      style={{ 
                        background: isCurrentUser ? 'rgba(99, 102, 241, 0.08)' : undefined,
                        borderLeft: isCurrentUser ? '3px solid var(--primary)' : undefined 
                      }}
                    >
                      <td>
                        <span className={`badge ${
                          item.posicion === 1 ? 'badge-warning' : 
                          item.posicion === 2 ? 'badge-info' : 'badge-secondary'
                        }`} style={{ fontSize: '0.85rem' }}>
                          # {item.posicion}
                        </span>
                      </td>
                      <td style={{ fontWeight: isCurrentUser ? 700 : 500 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {item.usuario_nombre} {isCurrentUser && <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 500 }}>(Tú)</span>}
                        </div>
                      </td>
                      <td style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                        {item.puntos_totales} pts
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {isLeader ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--warning)', fontWeight: 600, fontSize: '0.8rem' }}>
                            <Trophy size={14} /> Líder
                          </span>
                        ) : isCurrentUser ? (
                          <span style={{ color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600 }}>Miembro</span>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Participantes */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Users size={20} color="var(--primary)" /> Lista de Participantes ({participants.length})
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
            {participants.map((member) => (
              <div 
                key={member.id} 
                className="glass-panel" 
                style={{ 
                  padding: '1rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem', 
                  background: 'rgba(255,255,255,0.01)',
                  borderRadius: '12px'
                }}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  fontSize: '0.9rem'
                }}>
                  {member.nombre.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{member.nombre}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Unido el: {new Date(member.fecha_union).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupDetailPage;
