import api from './api';

const authService = {
  login: async (credentials) => {
    try {
      const response = await api.post('/users/login', credentials, {
        withCredentials: true,
      });
      return response.data; 
    } catch (error) {
      throw error;
    }
  },

  register: async (userData) => {
    try {
      const response = await api.post('/users/register', userData, {
        withCredentials: true, 
      });
      return response.data; 
    } catch (error) {
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.post('/users/logout', {}, { withCredentials: true }); 
    } catch (error) {
      throw error;
    }
  },
};

export default authService;