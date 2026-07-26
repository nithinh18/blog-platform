import api from './api';

export const registerUser = (data) => api.post('/auth/register', data).then((res) => res.data);

export const verifyEmailOtp = (code) =>
  api.post('/auth/verify-email-otp', { code }).then((res) => res.data);

export const resendVerification = () =>
  api.post('/auth/resend-verification').then((res) => res.data);

export const loginUser = (data) => api.post('/auth/login', data).then((res) => res.data);

export const verifyLoginTwoFactor = (challengeToken, code) =>
  api.post('/auth/2fa/verify-login', { challengeToken, code }).then((res) => res.data);

export const requestOtpLogin = (email) =>
  api.post('/auth/otp/request-login', { email }).then((res) => res.data);

export const otpLogin = (email, code) =>
  api.post('/auth/otp/login', { email, code }).then((res) => res.data);

export const googleSignIn = (credential) =>
  api.post('/auth/google', { credential }).then((res) => res.data);

export const getCurrentUser = () => api.get('/auth/me').then((res) => res.data);

export const updateProfile = (data) => api.put('/auth/me', data).then((res) => res.data);

export const uploadAvatar = (file) => {
  const formData = new FormData();
  formData.append('avatar', file);
  return api
    .post('/auth/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((res) => res.data);
};

export const updateInterests = (data) => api.put('/auth/interests', data).then((res) => res.data);

export const forgotPassword = (email) =>
  api.post('/auth/forgot-password', { email }).then((res) => res.data);

export const resetPasswordOtp = (email, code, password) =>
  api.post('/auth/reset-password-otp', { email, code, password }).then((res) => res.data);

export const getFeedUrl = () => api.get('/auth/feed-url').then((res) => res.data);

export const deleteAccount = (password) =>
  api.delete('/auth/account', { data: { password } }).then((res) => res.data);

export const deactivateAccount = (password, days) =>
  api.post('/auth/deactivate', { password, days }).then((res) => res.data);

export const setupTwoFactor = () => api.post('/auth/2fa/setup').then((res) => res.data);

export const enableTwoFactor = (code) =>
  api.post('/auth/2fa/enable', { code }).then((res) => res.data);

export const setupEmailTwoFactor = () => api.post('/auth/2fa/email/enable').then((res) => res.data);

export const confirmEmailTwoFactor = (code) =>
  api.post('/auth/2fa/email/confirm', { code }).then((res) => res.data);

export const disableTwoFactor = (password) =>
  api.post('/auth/2fa/disable', { password }).then((res) => res.data);
