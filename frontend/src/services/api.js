import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  verify: () => api.get('/auth/verify'),
};

export const productsAPI = {
  getAll: () => api.get('/products'),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

export const stockAPI = {
  stockIn: (data) => api.post('/stock/in', data),
  stockOut: (data) => api.post('/stock/out', data),
  getTransactions: (params) => api.get('/stock/transactions', { params }),
};

export const activityAPI = {
  getLog: (params) => api.get('/activity/log', { params }),
  getMyActivities: () => api.get('/activity/my-activities'),
};

export const reportsAPI = {
  stockSummary: () => api.get('/reports/stock-summary'),
  transactionsByType: (days = 30) => api.get('/reports/transactions-by-type', { params: { days } }),
  transactionsByProduct: (days = 30) => api.get('/reports/transactions-by-product', { params: { days } }),
  staffMetrics: () => api.get('/reports/staff-metrics'),
  lowStock: () => api.get('/reports/low-stock'),
  monthlyTrends: (days = 90) => api.get('/reports/monthly-trends', { params: { days } }),
};

export const usersAPI = {
  getStaff: () => api.get('/users'),
};

export default api;
