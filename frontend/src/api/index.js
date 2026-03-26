import api from './axios';

// ─── Auth ─────────────────────────────────────────────
export const authApi = {
  register: (data)       => api.post('/auth/register', data),
  verifyEmail: (data)    => api.post('/auth/verify-email', data),
  resendOtp: (data)      => api.post('/auth/resend-otp', data),   // ← NEW
  login: (data)          => api.post('/auth/login', data),
  logout: ()             => api.post('/auth/logout'),
  refreshToken: ()       => api.post('/auth/refresh-token'),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data)  => api.post('/auth/reset-password', data),
};

// ─── User ─────────────────────────────────────────────
export const userApi = {
  getProfile: ()         => api.get('/user/profile'),
  updateProfile: (data)  => api.put('/user/profile', data),
  changePassword: (data) => api.put('/user/password', data),
  uploadPicture: (form)  => api.post('/user/profile/picture', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteAccount: (data)  => api.delete('/user/account', { data }),
};

// ─── Accounts ─────────────────────────────────────────
export const accountsApi = {
  getAll: ()            => api.get('/accounts'),
  create: (data)        => api.post('/accounts', data),
  update: (id, data)    => api.put(`/accounts/${id}`, data),
  delete: (id)          => api.delete(`/accounts/${id}`),
  archive: (id)         => api.patch(`/accounts/${id}/archive`),
  transfer: (data)      => api.post('/accounts/transfer', data),
  getTransactions: (id, params) => api.get(`/accounts/${id}/transactions`, { params }),
};

// ─── Categories ───────────────────────────────────────
export const categoriesApi = {
  getAll: (params)      => api.get('/categories', { params }),
  create: (data)        => api.post('/categories', data),
  update: (id, data)    => api.put(`/categories/${id}`, data),
  delete: (id)          => api.delete(`/categories/${id}`),
};

// ─── Transactions ─────────────────────────────────────
export const transactionsApi = {
  getAll: (params)      => api.get('/transactions', { params }),
  // create & update both use multipart/form-data so multer can handle receipt uploads
  create: (form)        => api.post('/transactions', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getOne: (id)          => api.get(`/transactions/${id}`),
  // BUG FIX: update must also be multipart/form-data (same as create) — not JSON.
  // The server uses multer on PUT /:id, so sending JSON breaks file upload on edit.
  update: (id, form)    => api.put(`/transactions/${id}`, form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id)          => api.delete(`/transactions/${id}`),
  bulkDelete: (ids)     => api.post('/transactions/bulk-delete', { ids }),
  export: (params)      => api.get('/transactions/export', { params, responseType: 'blob' }),
  importCSV: (form)     => api.post('/transactions/import-csv', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

// ─── Recurring ────────────────────────────────────────
export const recurringApi = {
  getAll: ()            => api.get('/recurring'),
  create: (data)        => api.post('/recurring', data),
  update: (id, data)    => api.put(`/recurring/${id}`, data),
  delete: (id)          => api.delete(`/recurring/${id}`),
  pause: (id)           => api.put(`/recurring/${id}/pause`),
  resume: (id)          => api.put(`/recurring/${id}/resume`),
};

// ─── Budgets ──────────────────────────────────────────
export const budgetsApi = {
  getAll: ()            => api.get('/budgets'),
  create: (data)        => api.post('/budgets', data),
  update: (id, data)    => api.put(`/budgets/${id}`, data),
  delete: (id)          => api.delete(`/budgets/${id}`),
};

// ─── Goals ────────────────────────────────────────────
export const goalsApi = {
  getAll: ()                   => api.get('/goals'),
  create: (data)               => api.post('/goals', data),
  update: (id, data)           => api.put(`/goals/${id}`, data),
  delete: (id)                 => api.delete(`/goals/${id}`),
  addContribution: (id, data)  => api.post(`/goals/${id}/contribute`, data),
  getContributions: (id)       => api.get(`/goals/${id}/contributions`),
};

// ─── Dashboard ────────────────────────────────────────
export const dashboardApi = {
  getStats: (params)           => api.get('/dashboard/stats', { params }),
  getIncomeExpense: (params)   => api.get('/dashboard/charts/income-expense', { params }),
  getCategoryBreakdown: (params) => api.get('/dashboard/charts/category-breakdown', { params }),
  getCashFlow: (params)        => api.get('/dashboard/charts/cash-flow', { params }),
  getSavingsTrend: (params)    => api.get('/dashboard/charts/savings-trend', { params }),
  getAccountsChart: ()         => api.get('/dashboard/charts/accounts'),
};

// ─── Reports ──────────────────────────────────────────
export const reportsApi = {
  getMonthly: (params)         => api.get('/reports/monthly', { params }),
};
