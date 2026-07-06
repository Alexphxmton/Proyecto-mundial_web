import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { CalendarDays, Award, Clock3, ShieldAlert, Trophy } from 'lucide-react';

const PredictionsPage = () => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const response = await api.get('/predictions');
        setPredictions(response.data);
      } catch (err) {
        console.error('Error al cargar pronósticos:', err);
        setError('No se pudieron cargar tus pronósticos.');
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
  }, []);

  const formatDate = (date) => new Date(date).toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const getPointsBadge = (points) => {
    if (points >= 3) {
      return { label: `${points} pts`, color: 'var(--success)' };
    }
    if (points === 1) {
      return { label: `${points} pt`, color: 'var(--primary)' };
    }
    return { label: `${points} pts`, color: 'var(--text-secondary)' };
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Trophy color="var(--primary)" /> Mis Pronósticos
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Consulta todos tus pronósticos, el resultado real y los puntos obtenidos.
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '260px', gap: '1rem' }}>
          <div className="loader" style={{
            width: '40px',
            height: '40px',
            border: '4px solid rgba(255, 255, 255, 0.1)',
            borderTopColor: 'var(--primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Cargando tus pronósticos...</p>
        </div>
      ) : error ? (
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', borderLeft: '4px solid var(--danger)' }}>
          <ShieldAlert size={40} color="var(--danger)" style={{ marginBottom: '1rem' }} />
          <p>{error}</p>
        </div>
      ) : predictions.length === 0 ? (
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Aún no tienes pronósticos registrados.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {predictions.map((item) => {
            const pointsBadge = getPointsBadge(item.puntos_obtenidos);
            return (
              <div key={item.prediction_id} className="glass-panel" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.25rem' }}>
                      {item.fase_nombre}
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                      {item.local_nombre} vs {item.visitante_nombre}
                    </div>
                  </div>

                  <div style={{
                    padding: '0.45rem 0.8rem',
                    borderRadius: '999px',
                    background: `${pointsBadge.color}15`,
                    color: pointsBadge.color,
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}>
                    <Award size={16} /> {pointsBadge.label}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                      <CalendarDays size={14} /> Fecha
                    </div>
                    <div style={{ fontWeight: 600 }}>{formatDate(item.fecha_hora)}</div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                      <Clock3 size={14} /> Tu pronóstico
                    </div>
                    <div style={{ fontWeight: 700 }}>{item.goles_local_pronosticado} - {item.goles_visitante_pronosticado}</div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                      <Trophy size={14} /> Resultado real
                    </div>
                    <div style={{ fontWeight: 700 }}>
                      {item.goles_local !== null && item.goles_visitante !== null ? `${item.goles_local} - ${item.goles_visitante}` : 'Pendiente'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PredictionsPage;
