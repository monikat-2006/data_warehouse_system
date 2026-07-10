import axios from 'axios';



const api = axios.create({

  baseURL: 'http://localhost:5000/api',

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



export const barcodeAPI = {
  lookup: (code) => api.post('/barcode/lookup', { code }),
  generate: (product_id) => api.post('/barcode/generate', { product_id }),
  batchLookup: (codes) => api.post('/barcode/batch-lookup', { codes }),
};

export const alertsAPI = {
  getLowStock: () => api.get('/alerts/low-stock'),
  getReorderSuggestions: () => api.get('/alerts/reorder-suggestions'),
  getNotifications: (page = 1) => api.get('/alerts/notifications', { params: { page } }),
  markRead: (id) => api.put(`/alerts/notifications/${id}/read`),
  markAllRead: () => api.put('/alerts/notifications/read-all'),
  getUnusualActivity: () => api.get('/alerts/unusual-activity'),
};

export const searchAPI = {
  searchProducts: (filters) => api.post('/search/products', filters),
  searchTransactions: (filters) => api.post('/search/transactions', filters),
  getSuggestions: (q) => api.get('/search/suggestions', { params: { q } }),
  listFilters: () => api.get('/search/filters'),
  saveFilter: (data) => api.post('/search/filters/save', data),
  updateFilter: (id, data) => api.put(`/search/filters/${id}`, data),
  deleteFilter: (id) => api.delete(`/search/filters/${id}`),
};

export default api;

