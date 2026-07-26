import api from './api';

export const getPosts = (params = {}) => api.get('/posts', { params }).then((res) => res.data);

export const getTrending = (params = {}) =>
  api.get('/posts/trending', { params }).then((res) => res.data);

export const getFeed = (params = {}) => api.get('/posts/feed', { params }).then((res) => res.data);

export const getRecommended = (params = {}) =>
  api.get('/posts/recommended', { params }).then((res) => res.data);

export const getSearchSuggestions = (q) =>
  api.get('/posts/search-suggestions', { params: { q } }).then((res) => res.data);

export const getTags = () => api.get('/posts/tags').then((res) => res.data);

export const getBookmarks = () => api.get('/posts/bookmarks/mine').then((res) => res.data);

export const getPost = (id) => api.get(`/posts/${id}`).then((res) => res.data);

export const uploadInlineImage = (file) => {
  const formData = new FormData();
  formData.append('image', file);
  return api
    .post('/posts/upload-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((res) => res.data);
};

export const createPost = (formData) =>
  api
    .post('/posts', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((res) => res.data);

export const updatePost = (id, formData) =>
  api
    .put(`/posts/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((res) => res.data);

export const deletePost = (id) => api.delete(`/posts/${id}`).then((res) => res.data);

export const toggleLike = (id) => api.post(`/posts/${id}/like`).then((res) => res.data);

export const toggleBookmark = (id) => api.post(`/posts/${id}/bookmark`).then((res) => res.data);

export const getRevisions = (id) => api.get(`/posts/${id}/revisions`).then((res) => res.data);

export const voteOnPoll = (id, optionIndex) =>
  api.post(`/posts/${id}/poll/vote`, { optionIndex }).then((res) => res.data);
