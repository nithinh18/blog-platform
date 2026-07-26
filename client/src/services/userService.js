import api from './api';

export const getPublicProfile = (id) => api.get(`/users/${id}`).then((res) => res.data);

export const toggleFollow = (id) => api.post(`/users/${id}/follow`).then((res) => res.data);

export const getLeaderboard = () => api.get('/users/leaderboard').then((res) => res.data);
