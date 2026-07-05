import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Settings, PlusCircle, RefreshCw, Edit, Save, Trash, Clock, CheckCircle2, ShieldAlert } from 'lucide-react';

const AdminDashboard = () => {
  const [matches, setMatches] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [fases, setFases] = useState([]);
  const [estadios, setEstadios] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Mensajes de estatus
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [syncLoading, setSyncLoading] = useState(false);

  // Formulario de creación/edición
  const [isEditing, setIsEditing] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  
  const [apiEventId, setApiEventId] = useState('');
  const [faseId, setFaseId] = useState('');
  const [localId, setLocalId] = useState('');
  const [visitanteId, setVisitanteId] = useState('');
  const [estadioId, setEstadioId] = useState('');
  const [fechaHora, setFechaHora] = useState('');
  const [estado, setEstado] = useState('PROGRAMADO');
  
  const [formLoading, setFormLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [matchesRes, equiposRes, fasesRes, sedesRes] = await Promise.all([
        api.get('/matches'),
        api.get('/matches/equipos'),
        api.get('/matches/fases'),
        api.get('/matches/sedes'),
      ]);
      
      setMatches(matchesRes.data);
      setEquipos(equiposRes.data);
      setFases(fasesRes.data);
      
      // Aplanar estadios de todas las sedes
      const allEstadios = [];
      sedesRes.data.forEach(sede => {
        if (sede.estadios) {
          sede.estadios.forEach(est => {
            allEstadios.push({
              id: est.id,
              nombre: `${est.nombre} (${sede.nombre})`,
            });
          });
        }
      });
      setEstadios(allEstadios);
    } catch (err) {
      console.error(err);
      setError('Error al cargar la información del panel de administración');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSyncAll = async () => {
    setSyncLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await api.post('/admin/sync-today');
      setSuccess(response.data.message || 'Sincronización masiva de partidos ejecutada con éxito');
      loadData(); // Recargar partidos con los nuevos resultados
    } catch (err) {
      console.error(err);
      setError('Error al ejecutar la sincronización automática: ' + (err.response?.data?.error || err.message));
    } finally {
      setSyncLoading(false);
    }
  };

  const handleSyncMatch = async (matchId) => {
    setError('');
    setSuccess('');
    try {
      const response = await api.post(`/admin/sync-match/${matchId}`);
      setSuccess(response.data.message || 'Partido sincronizado con éxito');
      loadData();
    } catch (err) {
      console.error(err);
      setError('Error al sincronizar partido: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!faseId || !localId || !visitanteId || !estadioId || !fechaHora) {
      setError('Por favor, completa todos los campos obligatorios');
      return;
    }

    if (localId === visitanteId) {
      setError('El equipo local y el visitante no pueden ser el mismo');
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        api_event_id: apiEventId || null,
        fase_id: parseInt(faseId),
        equipo_local_id: parseInt(localId),
        equipo_visitante_id: parseInt(visitanteId),
        estadio_id: parseInt(estadioId),
        fecha_hora: new Date(fechaHora).toISOString(),
        estado: estado,
      };

      if (isEditing) {
        await api.put(`/admin/matches/${selectedMatchId}`, payload);
        setSuccess('Partido actualizado correctamente');
      } else {
        await api.post('/admin/matches', payload);
        setSuccess('Partido registrado correctamente');
      }

      resetForm();
      loadData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Error al procesar la solicitud');
    } finally {
      setFormLoading(false);
    }
  };

  const startEdit = (match) => {
    setIsEditing(true);
    setSelectedMatchId(match.id);
    setApiEventId(match.api_event_id || '');
    setFaseId(match.fase_id);
    // Buscar ids de equipos por nombre
    const local = equipos.find(eq => eq.nombre === match.local_nombre);
    const visitante = equipos.find(eq => eq.nombre === match.visitante_nombre);
    const estadio = estadios.find(est => est.nombre.startsWith(match.estadio_nombre));
    
    setLocalId(local ? local.id : '');
    setVisitanteId(visitante ? visitante.id : '');
    setEstadioId(estadio ? estadio.id : '');
    
    // Formatear fecha para input datetime-local (YYYY-MM-DDTHH:MM)
    const d = new Date(match.fecha_hora);
    // Ajustar zona horaria local
    const tzoffset = d.getTimezoneOffset() * 60000; 
    const localISOTime = (new Date(d.getTime() - tzoffset)).toISOString().slice(0, 16);
    setFechaHora(localISOTime);
    
    setEstado(match.estado);
  };

  const resetForm = () => {
    setIsEditing(false);
    setSelectedMatchId(null);
    setApiEventId('');
    setFaseId('');
    setLocalId('');
    setVisitanteId('');
    setEstadioId('');
    setFechaHora('');
    setEstado('PROGRAMADO');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifySelf: 'center', padding: '4rem', gap: '1rem' }}>
        <div className="loader" style={{
          width: '40px',
          height: '40px',
          border: '4px solid rgba(255, 255, 255, 0.1)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p>Cargando panel de administración...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings color="var(--primary)" /> Panel de Administración
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Registra nuevos partidos, asocia IDs de thesportsdb.com y gestiona la sincronización.</p>
        </div>

        <button 
          className="btn btn-success" 
          onClick={handleSyncAll} 
          disabled={syncLoading}
          style={{ padding: '0.6rem 1.2rem' }}
        >
          <RefreshCw size={16} className={syncLoading ? 'spin' : ''} />
          {syncLoading ? 'Sincronizando...' : 'Sincronizar Partidos de Hoy'}
        </button>
      </div>

      {/* Alertas */}
      {error && (
        <div className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid var(--danger)', color: '#f87171', background: 'rgba(239, 68, 68, 0.08)' }}>
          <ShieldAlert size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} /> {error}
        </div>
      )}

      {success && (
        <div className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid var(--success)', color: '#34d399', background: 'rgba(16, 185, 129, 0.08)' }}>
          <CheckCircle2 size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} /> {success}
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '2rem'
      }}>
        {/* Formulario de Registro / Edición */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', color: 'var(--primary)' }}>
            <PlusCircle size={20} /> {isEditing ? 'Editar Partido' : 'Registrar Nuevo Partido'}
          </h2>

          <form onSubmit={handleSubmit} style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.25rem'
          }}>
            {/* API Event ID */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>TheSportsDB Event ID (Opcional)</label>
              <input 
                type="text" 
                placeholder="Ej: 441616" 
                value={apiEventId} 
                onChange={(e) => setApiEventId(e.target.value)}
              />
            </div>

            {/* Fase */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Fase *</label>
              <select value={faseId} onChange={(e) => setFaseId(e.target.value)} required>
                <option value="">Selecciona fase...</option>
                {fases.map(f => (
                  <option key={f.id} value={f.id}>{f.nombre}</option>
                ))}
              </select>
            </div>

            {/* Local */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Equipo Local *</label>
              <select value={localId} onChange={(e) => setLocalId(e.target.value)} required>
                <option value="">Selecciona local...</option>
                {equipos.map(eq => (
                  <option key={eq.id} value={eq.id}>{eq.nombre} ({eq.codigo_fifa})</option>
                ))}
              </select>
            </div>

            {/* Visitante */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Equipo Visitante *</label>
              <select value={visitanteId} onChange={(e) => setVisitanteId(e.target.value)} required>
                <option value="">Selecciona visitante...</option>
                {equipos.map(eq => (
                  <option key={eq.id} value={eq.id}>{eq.nombre} ({eq.codigo_fifa})</option>
                ))}
              </select>
            </div>

            {/* Estadio */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Estadio *</label>
              <select value={estadioId} onChange={(e) => setEstadioId(e.target.value)} required>
                <option value="">Selecciona estadio...</option>
                {estadios.map(est => (
                  <option key={est.id} value={est.id}>{est.nombre}</option>
                ))}
              </select>
            </div>

            {/* Fecha y Hora */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Fecha y Hora *</label>
              <input 
                type="datetime-local" 
                value={fechaHora} 
                onChange={(e) => setFechaHora(e.target.value)} 
                required
              />
            </div>

            {/* Estado */}
            {isEditing && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Estado *</label>
                <select value={estado} onChange={(e) => setEstado(e.target.value)} required>
                  <option value="PROGRAMADO">Programado</option>
                  <option value="EN_CURSO">En curso</option>
                  <option value="FINALIZADO">Finalizado</option>
                </select>
              </div>
            )}

            {/* Acciones del formulario */}
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              {isEditing && (
                <button 
                  type="button" 
                  onClick={resetForm} 
                  className="btn btn-secondary"
                  disabled={formLoading}
                >
                  Cancelar
                </button>
              )}
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={formLoading}
              >
                <Save size={16} />
                {formLoading ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Registrar Partido'}
              </button>
            </div>
          </form>
        </div>

        {/* Lista de Partidos Existentes */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '1.25rem' }}>Partidos Registrados ({matches.length})</h2>
          
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Fase</th>
                  <th>Partido</th>
                  <th>Estadio / Ciudad</th>
                  <th>Fecha</th>
                  <th>API ID</th>
                  <th>Estatus / Marcador</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((match) => (
                  <tr key={match.id}>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{match.fase_nombre}</td>
                    <td style={{ fontWeight: 600 }}>
                      {match.local_nombre} vs {match.visitante_nombre}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {match.estadio_nombre}, {match.ciudad_nombre}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {new Date(match.fecha_hora).toLocaleDateString()} {new Date(match.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                      {match.api_event_id || <span style={{ color: 'var(--text-muted)' }}>-</span>}
                    </td>
                    <td>
                      {match.estado === 'FINALIZADO' ? (
                        <span className="badge badge-danger">
                          {match.goles_local} - {match.goles_visitante} (F)
                        </span>
                      ) : match.estado === 'EN_CURSO' ? (
                        <span className="badge badge-success">
                          {match.goles_local || 0} - {match.goles_visitante || 0} (En Vivo)
                        </span>
                      ) : (
                        <span className="badge badge-info">Programado</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          onClick={() => startEdit(match)} 
                          className="btn btn-secondary" 
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: '6px' }}
                          title="Editar Partido"
                        >
                          <Edit size={12} />
                        </button>
                        {match.api_event_id && match.estado !== 'FINALIZADO' && (
                          <button 
                            onClick={() => handleSyncMatch(match.id)} 
                            className="btn btn-success" 
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: '6px' }}
                            title="Sincronizar Marcador"
                          >
                            <RefreshCw size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <style>{`
        .spin {
          animation: spin-anim 1s linear infinite;
        }
        @keyframes spin-anim {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
