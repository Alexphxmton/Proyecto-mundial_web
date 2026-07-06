import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import api from '../services/api';
import { MapPin, ShieldAlert } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Marcador personalizado premium tipo pulso de radar
const createCustomIcon = () => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="position: relative; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;">
        <div style="
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background-color: var(--primary);
          opacity: 0.4;
          animation: pulse 1.8s infinite ease-in-out;
        "></div>
        <div style="
          position: absolute;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background-color: var(--primary);
          border: 2px solid white;
          box-shadow: 0 0 8px rgba(99, 102, 241, 0.8);
        "></div>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10],
  });
};

const MapSedes = () => {
  const [sedes, setSedes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSedes = async () => {
      try {
        const response = await api.get('/matches/sedes');
        setSedes(response.data);
      } catch (err) {
        console.error('Error al cargar sedes:', err);
        setError('No se pudieron cargar las sedes oficiales en este momento.');
      } finally {
        setLoading(false);
      }
    };
    fetchSedes();
  }, []);

  // Agregar la regla de animación de pulso de radar en la carga del componente
  useEffect(() => {
    const styleId = 'radar-pulse-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        @keyframes pulse {
          0% { transform: scale(0.6); opacity: 0.8; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

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
        <p style={{ color: 'var(--text-secondary)' }}>Cargando mapa de sedes oficiales...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
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

  // Centro de América del Norte (EE.UU., México, Canadá)
  const position = [39.099727, -94.578567]; 
  const zoom = 4;
  const sedesConCoordenadas = sedes.filter((sede) => {
    const latitud = Number(sede.latitud);
    const longitud = Number(sede.longitud);
    return Number.isFinite(latitud) && Number.isFinite(longitud);
  });

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.5rem', marginBottom: '0.25rem' }}>
          <MapPin color="var(--primary)" /> Sedes del Mundial 2026
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Explora los estadios y ciudades anfitrionas de Canadá, México y Estados Unidos. Haz clic en un marcador para ver más información.
        </p>
      </div>

      <div style={{ height: '500px', width: '100%', position: 'relative' }}>
        <MapContainer 
          center={position} 
          zoom={zoom} 
          style={{ height: '100%', width: '100%', borderRadius: '12px' }}
          scrollWheelZoom={false}
        >
          {/* Mosaico oscuro premium de CartoDB (Voyager Dark) */}
          <TileLayer
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            className="dark-tile-layer"
          />

          {sedesConCoordenadas.map((sede) => (
            <Marker 
              key={sede.id} 
              position={[Number(sede.latitud), Number(sede.longitud)]}
              icon={createCustomIcon()}
            >
              <Popup>
                <div style={{ fontFamily: 'var(--font-body)', padding: '0.2rem' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontFamily: 'var(--font-title)', fontSize: '1.1rem', color: 'var(--primary)' }}>
                    {sede.nombre}, {sede.pais}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
                    <strong>Estadios oficiales:</strong>
                    {sede.estadios && sede.estadios.map((est) => (
                      <div key={est.id} style={{ 
                        borderLeft: '2px solid var(--success)', 
                        paddingLeft: '0.5rem', 
                        margin: '0.2rem 0',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '4px',
                        padding: '0.25rem 0.5rem'
                      }}>
                        <div style={{ fontWeight: 600 }}>{est.nombre}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                          Capacidad: {Number.isFinite(Number(est.capacidad)) ? Number(est.capacidad).toLocaleString() : 'No disponible'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default MapSedes;
