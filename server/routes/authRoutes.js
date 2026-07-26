const express = require('express');
const {
  register,
  verifyEmailOtp,
  resendVerification,
  login,
  verifyLoginTwoFactor,
  requestOtpLogin,
  otpLogin,
  googleAuth,
  setupTwoFactor,
  enableTwoFactor,
  setupEmailTwoFactor,
  confirmEmailTwoFactor,
  disableTwoFactor,
  getMe,
  updateMe,
  uploadAvatar,
  updateInterests,
  forgotPassword,
  resetPasswordOtp,
  getFeedUrl,
  deactivateAccount,
  deleteAccount,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');
const validate = require('../middleware/validate');
const { uploadImage } = require('../middleware/upload');
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordOtpSchema,
  verifyEmailOtpSchema,
  otpRequestSchema,
  otpLoginSchema,
  googleAuthSchema,
  interestsSchema,
  updateProfileSchema,
  deactivateAccountSchema,
} = require('../validators/authValidators');

const router = express.Router();

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/verify-email-otp', protect, validate(verifyEmailOtpSchema), verifyEmailOtp);

router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/2fa/verify-login', authLimiter, verifyLoginTwoFactor);
router.post('/otp/request-login', authLimiter, validate(otpRequestSchema), requestOtpLogin);
router.post('/otp/login', authLimiter, validate(otpLoginSchema), otpLogin);
router.post('/google', authLimiter, validate(googleAuthSchema), googleAuth);

router.get('/me', protect, getMe);
router.put('/me', protect, validate(updateProfileSchema), updateMe);
router.post('/avatar', protect, ...uploadImage('avatar'), uploadAvatar);
router.put('/interests', protect, validate(interestsSchema), updateInterests);
router.get('/feed-url', protect, getFeedUrl);
router.post('/deactivate', protect, validate(deactivateAccountSchema), deactivateAccount);
router.delete('/account', protect, deleteAccount);

router.post('/2fa/setup', protect, setupTwoFactor);
router.post('/2fa/enable', protect, enableTwoFactor);
router.post('/2fa/email/enable', protect, setupEmailTwoFactor);
router.post('/2fa/email/confirm', protect, validate(verifyEmailOtpSchema), confirmEmailTwoFactor);
router.post('/2fa/disable', protect, disableTwoFactor);

router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password-otp', authLimiter, validate(resetPasswordOtpSchema), resetPasswordOtp);
router.post('/resend-verification', protect, resendVerification);

module.exports = router;
