import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('marketlink_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get('/auth/me');
        if (data.success) {
          setUser(data.data);
          localStorage.setItem('marketlink_user', JSON.stringify(data.data));
        }
      } catch (err) {
        console.error('Auth verification failed:', err.message);
        localStorage.removeItem('marketlink_token');
        localStorage.removeItem('marketlink_user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.success) {
      localStorage.setItem('marketlink_token', data.data.token);
      localStorage.setItem('marketlink_user', JSON.stringify(data.data));
      setUser(data.data);
      return data.data;
    }
  };

  const register = async (registrationData) => {
    const { data } = await api.post('/auth/register', registrationData);
    if (data.success) {
      localStorage.setItem('marketlink_token', data.data.token);
      localStorage.setItem('marketlink_user', JSON.stringify(data.data));
      setUser(data.data);
      return data.data;
    }
  };

  const logout = () => {
    localStorage.removeItem('marketlink_token');
    localStorage.removeItem('marketlink_user');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
