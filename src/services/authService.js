// authService.js
import api from './api';

const authService = {
  login: async (credentials) => {
    try {
      const response = await api.post('/users/login', credentials);
      // Store token in localStorage if received
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  register: async (userData) => {
    try {
      const response = await api.post('/users/register', userData);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    // Additional cleanup if needed
  }
};

export default authService;