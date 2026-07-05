import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import MatchCard from '../components/MatchCard';
import { LayoutDashboard, Users, Award, Calendar, ChevronRight, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/dashboard/summary');
      setSummary(response.data);
    } catch (err) {
      console.error('Error al cargar dashboard:', err);
      setError('Ocurrió un error al obtener la información de tu cuenta.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handlePredictionSaved = (matchId, newPrediction) => {
    // Actualizar el partido localmente en el dashboard
    if (summary) {
      const updatedMatches = summary.proximosPendientes.filter(m => m.id !== matchId);
      // Recargar datos en segundo plano para actualizar puntos/grupos
      fetchDashboardData();
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
        <p style={{ color: 'var(--text-secondary)' }}>Cargando resumen del dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', borderLeft: '4px solid var(--danger)' }}>
        <ShieldAlert size={40} color="var(--danger)" style={{ marginBottom: '1rem' }} />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Hola, <span style={{ color: 'var(--primary)' }}>{user.nombre}</span></h1>
        <p style={{ color: 'var(--text-secondary)' }}>Aquí tienes el resumen de tu quiniela y las posiciones en tus grupos.</p>
      </div>

      {/* Tarjetas de Métricas Rápidas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.5rem'
      }}>
        {/* Puntos totales */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            background: 'rgba(99, 102, 241, 0.15)',
            color: 'var(--primary)',
            padding: '1rem',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Award size={28} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Puntaje Acumulado</span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.2rem' }}>{summary.puntajeAcumulado} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 400 }}>pts</span></h3>
          </div>
        </div>

        {/* Grupos en los que participa */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            color: 'var(--success)',
            padding: '1rem',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Users size={28} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Grupos Creados / Unidos</span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.2rem' }}>{summary.cantidadGrupos}</h3>
          </div>
        </div>
      </div>

      {/* Cuerpo del Dashboard */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '2rem'
      }}>
        {/* Posiciones en Grupos */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={20} color="var(--primary)" /> Mis Posiciones en Grupos
            </h2>
            <Link to="/groups" style={{ fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
              Ver todos <ChevronRight size={16} />
            </Link>
          </div>

          {summary.posicionesGrupos.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
              Aún no perteneces a ningún grupo. ¡Únete a uno o crea tu propio grupo para competir!
              <div style={{ marginTop: '1rem' }}>
                <Link to="/groups" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Ir a Grupos</Link>
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Grupo</th>
                    <th>Puntos</th>
                    <th>Posición</th>
                    <th>Participantes</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.posicionesGrupos.map((g) => (
                    <tr key={g.grupo_id}>
                      <td style={{ fontWeight: 600 }}>{g.grupo_nombre}</td>
                      <td>{g.puntos_totales} pts</td>
                      <td>
                        <span className={`badge ${g.posicion === 1 ? 'badge-warning' : 'badge-info'}`}>
                          # {g.posicion}
                        </span>
                      </td>
                      <td>{g.total_miembros} miembros</td>
                      <td>
                        <Link to={`/groups/${g.grupo_id}`} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: '6px' }}>
                          Ver Detalle
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Próximos Partidos Pendientes de Pronóstico */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Calendar size={20} color="var(--primary)" /> Pronósticos Pendientes (Próximos Partidos)
          </h2>

          {summary.proximosPendientes.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
              ¡Excelente! Tienes todos los próximos partidos pronosticados.
              <div style={{ marginTop: '1rem' }}>
                <Link to="/calendar" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Ver Calendario Completo</Link>
              </div>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1rem'
            }}>
              {summary.proximosPendientes.map((match) => (
                <MatchCard 
                  key={match.id} 
                  match={{ ...match, pronostico: null }} 
                  onPredictionSaved={handlePredictionSaved}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
