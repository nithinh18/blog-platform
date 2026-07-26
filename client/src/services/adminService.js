import api from './api';

export const getAdminOverview = () => api.get('/admin/overview').then((res) => res.data);

export const listAdminUsers = () => api.get('/admin/users').then((res) => res.data);

export const setUserRole = (id, role) =>
  api.put(`/admin/users/${id}/role`, { role }).then((res) => res.data);

export const deleteAdminUser = (id) => api.delete(`/admin/users/${id}`).then((res) => res.data);

export const listReports = (status = 'open') =>
  api.get('/admin/reports', { params: { status } }).then((res) => res.data);

export const resolveReport = (id, removeContent) =>
  api.put(`/admin/reports/${id}/resolve`, { removeContent }).then((res) => res.data);

export const dismissReport = (id) =>
  api.put(`/admin/reports/${id}/dismiss`).then((res) => res.data);
