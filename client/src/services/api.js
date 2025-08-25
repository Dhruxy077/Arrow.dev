import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const processRequest = async (userInput) => {
  try {
    const response = await api.post('/api/process-request', {
      userInput: userInput
    });
    return response.data;
  } catch (error) {
    console.error('API request failed:', error);
    throw new Error(error.response?.data?.error || 'Failed to process request');
  }
};

export const checkServerHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
};

export default api;