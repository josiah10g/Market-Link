import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('marketlink_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  // If there is no token in localStorage, loading is immediately false! No waiting!
  const [loading, setLoading] = useState(() => {
    return !!localStorage.getItem('marketlink_token') && !localStorage.getItem('marketlink_user');
  });

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('marketlink_token');
      if (!token) {
        setLoading(false);
        return;
      }

      // Safety timer: prevent indefinite loading spinner / black screen if backend is cold
      const fallbackTimer = setTimeout(() => {
        setLoading(false);
      }, 3000);

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
        clearTimeout(fallbackTimer);
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
