import api from './api';

export const reportPost = (id, reason) =>
  api.post(`/reports/post/${id}`, { reason }).then((res) => res.data);

export const reportComment = (id, reason) =>
  api.post(`/reports/comment/${id}`, { reason }).then((res) => res.data);
