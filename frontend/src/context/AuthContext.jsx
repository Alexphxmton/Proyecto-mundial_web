import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

const normalizeUser = (userData) => {
  if (!userData || typeof userData !== 'object') {
    return null;
  }

  const normalizedName = userData.nombre || userData.name || userData.email || 'Usuario';
  const normalizedRole = userData.rol || userData.role || userData.rol_nombre || 'USUARIO';

  return {
    ...userData,
    nombre: normalizedName,
    rol: normalizedRole,
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restaurar sesión desde localStorage al iniciar
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(normalizeUser(parsedUser));
      } catch {
        setToken(savedToken);
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token: jwtToken, user: userData } = response.data;
      const normalizedUser = normalizeUser(userData);

      localStorage.setItem('token', jwtToken);
      localStorage.setItem('user', JSON.stringify(normalizedUser));

      setToken(jwtToken);
      setUser(normalizedUser);
      return normalizedUser;
    } catch (error) {
      const msg = error.response?.data?.error || 'Error al iniciar sesión';
      throw new Error(msg);
    }
  };

  const register = async (nombre, email, password) => {
    try {
      const response = await api.post('/auth/register', { nombre, email, password });
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.error || 'Error al registrarse';
      throw new Error(msg);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const updateUserProfile = (updatedUser) => {
    // updatedUser = { id, nombre, email }
    const mergedUser = normalizeUser({
      ...user,
      nombre: updatedUser.nombre,
      email: updatedUser.email,
    });
    localStorage.setItem('user', JSON.stringify(mergedUser));
    setUser(mergedUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
