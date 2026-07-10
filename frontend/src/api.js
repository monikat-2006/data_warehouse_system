import axios from "axios";

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL
});

// Add request interceptor for debugging
API.interceptors.request.use(
  (config) => {
    console.log('📤 API Request:', config.method.toUpperCase(), config.url, config.data);

    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error('📤 Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
API.interceptors.response.use(
  (response) => {
    console.log('📥 API Response:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('📥 Response Error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

export default API;