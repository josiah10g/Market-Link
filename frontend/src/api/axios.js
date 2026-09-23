import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000, // 15-second network timeout prevents infinite hanging requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('marketlink_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle global 401s and network timeouts
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      if (!error.response) {
        error.response = {
          data: {
            success: false,
            message: 'Server took too long to respond. Please check your internet connection or try again.'
          }
        };
      }
    }

    if (error.response && error.response.status === 401) {
      // Clear token and broadcast logout if session expired
      if (localStorage.getItem('marketlink_token')) {
        localStorage.removeItem('marketlink_token');
        localStorage.removeItem('marketlink_user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?expired=true';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
