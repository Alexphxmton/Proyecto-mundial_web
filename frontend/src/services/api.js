const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

/**
 * Servicio Axios base configurado con interceptores para JWT.
 */
import axios from 'axios';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para solicitudes: agregar el token si existe en localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para respuestas: manejar desautenticación automáticamente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token inválido o expirado, borrar del local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Podríamos redirigir a /login, pero es mejor que el AuthContext reaccione al cambio de estado
    }
    return Promise.reject(error);
  }
);

export default api;
