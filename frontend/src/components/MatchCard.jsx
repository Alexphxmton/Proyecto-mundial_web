import React, { useState } from 'react';
import { Calendar, MapPin, Award, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import api from '../services/api';

const MatchCard = ({ match, onPredictionSaved }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [homePred, setHomePred] = useState(match.pronostico ? match.pronostico.goles_local_pronosticado : '');
  const [awayPred, setAwayPred] = useState(match.pronostico ? match.pronostico.goles_visitante_pronosticado : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const matchTime = new Date(match.fecha_hora);
  const hasStarted = matchTime <= new Date();

  const handleSave = async (e) => {
    e.preventDefault();
    if (homePred === '' || awayPred === '') {
      setError('Debes ingresar ambos valores');
      return;
    }

    const gLocal = parseInt(homePred);
    const gVisitante = parseInt(awayPred);

    if (isNaN(gLocal) || gLocal < 0 || isNaN(gVisitante) || gVisitante < 0) {
      setError('Goles inválidos');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await api.post('/predictions', {
        partido_id: match.id,
        goles_local_pronosticado: gLocal,
        goles_visitante_pronosticado: gVisitante,
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setIsEditing(false);
        if (onPredictionSaved) {
          onPredictionSaved(match.id, response.data.prediction);
        }
      }, 1000);
    } catch (err) {
      console.error('Error al guardar pronóstico:', err);
      setError(err.response?.data?.error || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (estado) => {
    switch (estado) {
      case 'FINALIZADO':
        return <span className="badge badge-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><CheckCircle2 size={12} /> Finalizado</span>;
      case 'EN_CURSO':
        return <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', animation: 'pulse-bg 1.5s infinite' }}><Clock size={12} /> En Curso</span>;
      default:
        return <span className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>Programado</span>;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      {/* Header del Partido */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
        <span style={{ color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{match.fase_nombre}</span>
        {getStatusBadge(match.estado)}
      </div>

      {/* Enfrentamiento */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0' }}>
        {/* Local */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '0.5rem', textAlign: 'center' }}>
          <img 
            src={match.local_bandera} 
            alt={match.local_nombre} 
            style={{ width: '48px', height: '32px', objectFit: 'cover', borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
            onError={(e) => { e.target.src = 'https://placehold.co/48x32/1e1e24/ffffff?text=' + match.local_codigo; }}
          />
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{match.local_nombre}</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{match.local_codigo}</span>
        </div>

        {/* Marcador Real */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', padding: '0 1rem' }}>
          {match.estado === 'FINALIZADO' || match.estado === 'EN_CURSO' ? (
            <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-title)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <span>{match.goles_local}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>-</span>
              <span>{match.goles_visitante}</span>
            </div>
          ) : (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              VS
            </div>
          )}
        </div>

        {/* Visitante */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '0.5rem', textAlign: 'center' }}>
          <img 
            src={match.visitante_bandera} 
            alt={match.visitante_nombre} 
            style={{ width: '48px', height: '32px', objectFit: 'cover', borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
            onError={(e) => { e.target.src = 'https://placehold.co/48x32/1e1e24/ffffff?text=' + match.visitante_codigo; }}
          />
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{match.visitante_nombre}</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{match.visitante_codigo}</span>
        </div>
      </div>

      {/* Info de Estadio y Fecha */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', borderTop: '1px solid var(--border-glass)', paddingTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Calendar size={14} color="var(--primary)" />
          <span>{formatDate(match.fecha_hora)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <MapPin size={14} color="var(--primary)" />
          <span>{match.estadio_nombre}, {match.ciudad_nombre} ({match.ciudad_pais})</span>
        </div>
      </div>

      {/* Sección de Pronósticos del Usuario */}
      {onPredictionSaved && (
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.02)', 
          border: '1px solid var(--border-glass)',
          borderRadius: '10px',
          padding: '0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          {!isEditing ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>Tu Pronóstico</span>
                {match.pronostico ? (
                  <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: '0.2rem' }}>
                    {match.pronostico.goles_local_pronosticado} - {match.pronostico.goles_visitante_pronosticado}
                  </div>
                ) : (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin pronóstico</span>
                )}
              </div>

              {/* Botón de acción */}
              {!hasStarted ? (
                <button 
                  onClick={() => setIsEditing(true)} 
                  className="btn btn-secondary" 
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '6px' }}
                >
                  {match.pronostico ? 'Editar' : 'Pronosticar'}
                </button>
              ) : (
                match.pronostico && match.estado === 'FINALIZADO' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: match.pronostico.puntos_obtenidos > 0 ? 'var(--success)' : 'var(--text-muted)', fontWeight: 700 }}>
                    <Award size={16} />
                    <span>+{match.pronostico.puntos_obtenidos} pts</span>
                  </div>
                )
              )}
            </div>
          ) : (
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Pronosticar Score</span>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                <input 
                  type="number" 
                  min="0"
                  placeholder="Local"
                  value={homePred}
                  onChange={(e) => setHomePred(e.target.value)}
                  disabled={loading || success}
                  style={{ width: '65px', textAlign: 'center', padding: '0.4rem 0.5rem', fontSize: '0.9rem' }}
                />
                <span style={{ color: 'var(--text-muted)' }}>-</span>
                <input 
                  type="number" 
                  min="0"
                  placeholder="Vis."
                  value={awayPred}
                  onChange={(e) => setAwayPred(e.target.value)}
                  disabled={loading || success}
                  style={{ width: '65px', textAlign: 'center', padding: '0.4rem 0.5rem', fontSize: '0.9rem' }}
                />
              </div>

              {error && <div style={{ fontSize: '0.75rem', color: 'var(--danger)', textAlign: 'center' }}>{error}</div>}
              
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                <button 
                  type="button" 
                  onClick={() => setIsEditing(false)} 
                  className="btn btn-secondary" 
                  disabled={loading || success}
                  style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem', borderRadius: '6px' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading || success}
                  style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem', borderRadius: '6px', background: success ? 'var(--success)' : undefined }}
                >
                  {loading ? 'Guardando...' : success ? '¡Listo!' : 'Guardar'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default MatchCard;
