import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import MatchCard from '../components/MatchCard';
import { Calendar as CalendarIcon, Filter, RefreshCw, Info } from 'lucide-react';

const CalendarPage = () => {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [fases, setFases] = useState([]);
  
  // Filtros
  const [selectedFase, setSelectedFase] = useState('');
  const [selectedEstado, setSelectedEstado] = useState('');
  const [selectedFecha, setSelectedFecha] = useState('');

  const [loading, setLoading] = useState(true);
  const [loadingFases, setLoadingFases] = useState(true);
  const [error, setError] = useState('');

  const fetchFases = async () => {
    try {
      const response = await api.get('/matches/fases');
      setFases(response.data);
    } catch (err) {
      console.error('Error al cargar fases:', err);
    } finally {
      setLoadingFases(false);
    }
  };

  const fetchMatches = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (selectedFase) params.fase_id = selectedFase;
      if (selectedEstado) params.estado = selectedEstado;
      if (selectedFecha) params.fecha = selectedFecha;

      const response = await api.get('/matches', { params });
      setMatches(response.data);
    } catch (err) {
      console.error('Error al cargar partidos:', err);
      setError('Ocurrió un error al cargar el calendario de partidos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFases();
  }, []);

  useEffect(() => {
    fetchMatches();
  }, [selectedFase, selectedEstado, selectedFecha]);

  const handlePredictionSaved = (matchId, newPrediction) => {
    // Actualizar el pronóstico del partido en la lista local
    setMatches(prevMatches => 
      prevMatches.map(m => {
        if (m.id === matchId) {
          return {
            ...m,
            pronostico: {
              goles_local_pronosticado: newPrediction.goles_local_pronosticado,
              goles_visitante_pronosticado: newPrediction.goles_visitante_pronosticado,
              puntos_obtenidos: 0
            }
          };
        }
        return m;
      })
    );
  };

  const clearFilters = () => {
    setSelectedFase('');
    setSelectedEstado('');
    setSelectedFecha('');
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CalendarIcon color="var(--primary)" /> Calendario de Partidos
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Consulta fechas, sedes y registra tus predicciones para el Mundial 2026.</p>
        </div>
        
        <button className="btn btn-secondary" onClick={fetchMatches} style={{ padding: '0.5rem 1rem' }}>
          <RefreshCw size={16} /> Actualizar
        </button>
      </div>

      {/* Panel de Filtros */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
          <Filter size={16} /> Filtrar Partidos
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          alignItems: 'end'
        }}>
          {/* Fase */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Fase</label>
            <select value={selectedFase} onChange={(e) => setSelectedFase(e.target.value)}>
              <option value="">Todas las fases</option>
              {fases.map(f => (
                <option key={f.id} value={f.id}>{f.nombre}</option>
              ))}
            </select>
          </div>

          {/* Estado */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Estado</label>
            <select value={selectedEstado} onChange={(e) => setSelectedEstado(e.target.value)}>
              <option value="">Todos los estados</option>
              <option value="PROGRAMADO">Programado</option>
              <option value="EN_CURSO">En curso</option>
              <option value="FINALIZADO">Finalizado</option>
            </select>
          </div>

          {/* Fecha */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Fecha</label>
            <input 
              type="date" 
              value={selectedFecha} 
              onChange={(e) => setSelectedFecha(e.target.value)} 
            />
          </div>

          {/* Limpiar Filtros */}
          <div>
            <button 
              className="btn btn-secondary" 
              onClick={clearFilters}
              style={{ width: '100%', padding: '0.7rem' }}
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Partidos */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '1rem' }}>
          <div className="loader" style={{
            width: '40px',
            height: '40px',
            border: '4px solid rgba(255, 255, 255, 0.1)',
            borderTopColor: 'var(--primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Buscando partidos...</p>
        </div>
      ) : error ? (
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', borderLeft: '4px solid var(--danger)' }}>
          <p>{error}</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
          No se encontraron partidos que coincidan con los filtros seleccionados.
        </div>
      ) : (
        <div>
          {!user && (
            <div className="glass-panel" style={{ 
              padding: '1rem', 
              marginBottom: '1.5rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem',
              borderLeft: '4px solid var(--primary)',
              background: 'rgba(99, 102, 241, 0.05)'
            }}>
              <Info size={20} color="var(--primary)" />
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                ¿Quieres participar en la quiniela? <a href="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Inicia sesión</a> o <a href="/register" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>regístrate</a> para registrar tus pronósticos.
              </span>
            </div>
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem'
          }}>
            {matches.map((match) => (
              <MatchCard 
                key={match.id} 
                match={match} 
                onPredictionSaved={user ? handlePredictionSaved : null} 
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
