import api from './api';

export const getComments = (postId) => api.get(`/comments/${postId}`).then((res) => res.data);

export const addComment = (postId, comment, parentId) =>
  api.post(`/comments/${postId}`, { comment, parentId }).then((res) => res.data);

export const updateComment = (id, comment) =>
  api.put(`/comments/${id}`, { comment }).then((res) => res.data);

export const deleteComment = (id) => api.delete(`/comments/${id}`).then((res) => res.data);

export const toggleCommentLike = (id) => api.post(`/comments/${id}/like`).then((res) => res.data);
