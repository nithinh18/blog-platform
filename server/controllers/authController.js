const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const Report = require('../models/Report');
const { sendEmail } = require('../services/emailService');
const { issueOtp, consumeOtp, EMAIL_OTP_SELECT } = require('../services/otpService');
const { verifyGoogleToken } = require('../services/googleAuthService');
const {
  generateSecret,
  buildQrCodeDataUrl,
  verifyToken,
  generateBackupCodes,
  hashBackupCode,
} = require('../services/twoFactorService');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const generateChallengeToken = (id) =>
  jwt.sign({ id, purpose: '2fa-challenge' }, process.env.JWT_SECRET, { expiresIn: '5m' });

// Shared by every flow that needs to check + lazily clear a deactivation —
// returns a response payload to send with 403 if still deactivated, or null
// if the account is fine to proceed (reactivating it first if the window
// already passed).
const deactivationBlock = async (user) => {
  if (user.accountStatus !== 'deactivated') return null;
  if (user.isDeactivated()) {
    return { accountDeactivated: true, deactivatedUntil: user.deactivatedUntil };
  }
  await user.reactivateIfExpired();
  return null;
};

// Issues + emails an OTP for the given purpose, returning the raw code only
// when the caller should expose it (dev mode, no real SMTP configured).
const issueAndSendOtp = async (user, purpose, { subject, bodyPrefix }) => {
  const code = await issueOtp(user, purpose);
  await sendEmail({
    to: user.email,
    subject,
    text: `${bodyPrefix} ${code}\n\nThis code expires in 10 minutes. If you didn't request this, you can ignore this email.`,
  });
  return code;
};

// @desc    Register a new user (auto-logs-in; email is verified via OTP next)
// @route   POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    const user = await User.create({ name, email, password });
    const devOtp = await issueAndSendOtp(user, 'verify', {
      subject: 'Verify your BlogManthan email address',
      bodyPrefix: 'Your BlogManthan verification code is',
    });

    res.status(201).json({
      user: user.toSafeObject(),
      token: generateToken(user._id),
      devOtp,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Confirm the OTP emailed at signup (or via resend-verification)
// @route   POST /api/auth/verify-email-otp
const verifyEmailOtp = async (req, res, next) => {
  try {
    if (req.user.emailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }
    const user = await User.findById(req.user._id).select(EMAIL_OTP_SELECT);
    await consumeOtp(user, 'verify', req.body.code);
    user.emailVerified = true;
    await user.save();
    res.json({ user: user.toSafeObject() });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
};

// @desc    Resend the email verification OTP
// @route   POST /api/auth/resend-verification
const resendVerification = async (req, res, next) => {
  try {
    if (req.user.emailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }
    const user = await User.findById(req.user._id).select(EMAIL_OTP_SELECT);
    const devOtp = await issueAndSendOtp(user, 'verify', {
      subject: 'Verify your BlogManthan email address',
      bodyPrefix: 'Your BlogManthan verification code is',
    });
    res.json({ message: 'Verification code sent', devOtp });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
};

// @desc    Login user (may return a 2FA challenge instead of a token)
// @route   POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (!user.password) {
      return res.status(400).json({
        message: 'This account uses Sign in with Google — continue with Google below',
        googleOnly: true,
      });
    }
    if (!(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const deactivated = await deactivationBlock(user);
    if (deactivated) return res.status(403).json({ message: 'This account is deactivated', ...deactivated });

    if (user.twoFactorEnabled) {
      if (user.twoFactorMethod === 'email') {
        const otpUser = await User.findById(user._id).select(EMAIL_OTP_SELECT);
        const devOtp = await issueAndSendOtp(otpUser, '2fa', {
          subject: 'Your BlogManthan login code',
          bodyPrefix: 'Your BlogManthan login code is',
        });
        return res.json({
          requires2FA: true,
          method: 'email',
          challengeToken: generateChallengeToken(user._id),
          devOtp,
        });
      }
      return res.json({
        requires2FA: true,
        method: 'totp',
        challengeToken: generateChallengeToken(user._id),
      });
    }

    res.json({
      user: user.toSafeObject(),
      token: generateToken(user._id),
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
};

// @desc    Complete login by verifying a 2FA code (TOTP app, backup code, or email OTP)
// @route   POST /api/auth/2fa/verify-login
const verifyLoginTwoFactor = async (req, res, next) => {
  try {
    const { challengeToken, code } = req.body;
    if (!challengeToken || !code) {
      return res.status(400).json({ message: 'Challenge token and code are required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(challengeToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: 'Challenge has expired, please log in again' });
    }
    if (decoded.purpose !== '2fa-challenge') {
      return res.status(401).json({ message: 'Invalid challenge token' });
    }

    const user = await User.findById(decoded.id).select(
      `+twoFactorSecret +twoFactorBackupCodes ${EMAIL_OTP_SELECT}`
    );
    if (!user || !user.twoFactorEnabled) {
      return res.status(401).json({ message: 'Two-factor authentication is not active for this account' });
    }

    if (user.twoFactorMethod === 'email') {
      try {
        await consumeOtp(user, '2fa', code);
      } catch (err) {
        return res.status(err.status || 401).json({ message: err.message });
      }
      user.emailVerified = true;
      await user.save();
      return res.json({ user: user.toSafeObject(), token: generateToken(user._id) });
    }

    let valid = verifyToken(code, user.twoFactorSecret);

    if (!valid) {
      const hashed = hashBackupCode(code);
      const idx = user.twoFactorBackupCodes.indexOf(hashed);
      if (idx !== -1) {
        valid = true;
        user.twoFactorBackupCodes.splice(idx, 1);
        await user.save();
      }
    }

    if (!valid) {
      return res.status(401).json({ message: 'Invalid or expired code' });
    }

    res.json({ user: user.toSafeObject(), token: generateToken(user._id) });
  } catch (err) {
    next(err);
  }
};

// @desc    Request a passwordless login code emailed to the given address
// @route   POST /api/auth/otp/request-login
const requestOtpLogin = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: (email || '').toLowerCase() }).select(EMAIL_OTP_SELECT);

    // Same response either way so we don't leak which emails are registered.
    const genericResponse = { message: 'If that email has an account, a code has been sent' };
    if (!user) return res.json(genericResponse);

    const deactivated = await deactivationBlock(user);
    if (deactivated) return res.status(403).json({ message: 'This account is deactivated', ...deactivated });

    const devOtp = await issueAndSendOtp(user, 'login', {
      subject: 'Your BlogManthan login code',
      bodyPrefix: 'Your BlogManthan login code is',
    });
    res.json({ ...genericResponse, devOtp });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
};

// @desc    Complete a passwordless login with the emailed code
// @route   POST /api/auth/otp/login
const otpLogin = async (req, res, next) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email: (email || '').toLowerCase() }).select(EMAIL_OTP_SELECT);
    if (!user) {
      return res.status(400).json({ message: 'Incorrect code' });
    }

    await consumeOtp(user, 'login', code);

    const deactivated = await deactivationBlock(user);
    if (deactivated) return res.status(403).json({ message: 'This account is deactivated', ...deactivated });

    user.emailVerified = true;
    await user.save();
    res.json({ user: user.toSafeObject(), token: generateToken(user._id) });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
};

// @desc    Sign in (or sign up) with a Google account — Gmail addresses only
// @route   POST /api/auth/google
const googleAuth = async (req, res, next) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: 'Missing Google credential' });
    }

    let payload;
    try {
      payload = await verifyGoogleToken(credential);
    } catch (err) {
      return res.status(err.status || 401).json({ message: err.message });
    }

    const email = String(payload.email).toLowerCase();
    if (!email.endsWith('@gmail.com')) {
      return res.status(403).json({ message: 'Only Gmail accounts can sign in with Google here' });
    }

    let user = await User.findOne({ $or: [{ googleId: payload.sub }, { email }] });

    if (user) {
      if (!user.googleId) {
        user.googleId = payload.sub;
        user.emailVerified = true;
        await user.save();
      }
    } else {
      // Trust Google's verified identity over our own name heuristics —
      // just keep the stored value within sane bounds.
      let name = String(payload.name || '').trim();
      if (name.length < 2) name = email.split('@')[0];
      name = name.slice(0, 60);

      user = await User.create({
        name,
        email,
        googleId: payload.sub,
        authProvider: 'google',
        emailVerified: true,
      });
    }

    const deactivated = await deactivationBlock(user);
    if (deactivated) return res.status(403).json({ message: 'This account is deactivated', ...deactivated });

    if (user.twoFactorEnabled) {
      if (user.twoFactorMethod === 'email') {
        const otpUser = await User.findById(user._id).select(EMAIL_OTP_SELECT);
        const devOtp = await issueAndSendOtp(otpUser, '2fa', {
          subject: 'Your BlogManthan login code',
          bodyPrefix: 'Your BlogManthan login code is',
        });
        return res.json({
          requires2FA: true,
          method: 'email',
          challengeToken: generateChallengeToken(user._id),
          devOtp,
        });
      }
      return res.json({
        requires2FA: true,
        method: 'totp',
        challengeToken: generateChallengeToken(user._id),
      });
    }

    res.json({ user: user.toSafeObject(), token: generateToken(user._id) });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
};

// @desc    Start TOTP 2FA setup — generates a secret + QR code to scan
// @route   POST /api/auth/2fa/setup
const setupTwoFactor = async (req, res, next) => {
  try {
    if (req.user.twoFactorEnabled) {
      return res.status(400).json({ message: 'Two-factor authentication is already enabled' });
    }

    const secret = generateSecret();
    req.user.twoFactorTempSecret = secret;
    await req.user.save();

    const qrCodeDataUrl = await buildQrCodeDataUrl(req.user.email, secret);
    res.json({ secret, qrCodeDataUrl });
  } catch (err) {
    next(err);
  }
};

// @desc    Confirm TOTP 2FA setup with a code from the authenticator app
// @route   POST /api/auth/2fa/enable
const enableTwoFactor = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+twoFactorTempSecret');
    if (!user.twoFactorTempSecret) {
      return res.status(400).json({ message: 'Start setup first via /2fa/setup' });
    }

    if (!verifyToken(req.body.code, user.twoFactorTempSecret)) {
      return res.status(400).json({ message: 'Invalid code, please try again' });
    }

    const { codes, hashed } = generateBackupCodes();
    user.twoFactorSecret = user.twoFactorTempSecret;
    user.twoFactorTempSecret = undefined;
    user.twoFactorEnabled = true;
    user.twoFactorMethod = 'totp';
    user.twoFactorBackupCodes = hashed;
    await user.save();

    res.json({ message: 'Two-factor authentication enabled', backupCodes: codes });
  } catch (err) {
    next(err);
  }
};

// @desc    Start email-OTP 2FA setup — sends a confirmation code
// @route   POST /api/auth/2fa/email/enable
const setupEmailTwoFactor = async (req, res, next) => {
  try {
    if (req.user.twoFactorEnabled) {
      return res.status(400).json({ message: 'Two-factor authentication is already enabled' });
    }
    const user = await User.findById(req.user._id).select(EMAIL_OTP_SELECT);
    const devOtp = await issueAndSendOtp(user, '2fa', {
      subject: 'Confirm email-based two-factor authentication',
      bodyPrefix: 'Your BlogManthan confirmation code is',
    });
    res.json({ message: 'Confirmation code sent', devOtp });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
};

// @desc    Confirm email-OTP 2FA setup with the emailed code
// @route   POST /api/auth/2fa/email/confirm
const confirmEmailTwoFactor = async (req, res, next) => {
  try {
    if (req.user.twoFactorEnabled) {
      return res.status(400).json({ message: 'Two-factor authentication is already enabled' });
    }
    const user = await User.findById(req.user._id).select(EMAIL_OTP_SELECT);
    await consumeOtp(user, '2fa', req.body.code);

    const { codes, hashed } = generateBackupCodes();
    user.twoFactorEnabled = true;
    user.twoFactorMethod = 'email';
    user.twoFactorBackupCodes = hashed;
    user.emailVerified = true;
    await user.save();

    res.json({ message: 'Two-factor authentication enabled', backupCodes: codes });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
};

// @desc    Disable 2FA (requires current password, if the account has one)
// @route   POST /api/auth/2fa/disable
const disableTwoFactor = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+password');
    if (user.password && !(await user.comparePassword(req.body.password || ''))) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    user.twoFactorEnabled = false;
    user.twoFactorMethod = 'totp';
    user.twoFactorSecret = undefined;
    user.twoFactorTempSecret = undefined;
    user.twoFactorBackupCodes = [];
    await user.save();

    res.json({ message: 'Two-factor authentication disabled' });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    res.json({ user: req.user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

// @desc    Update current user's profile
// @route   PUT /api/auth/me
const updateMe = async (req, res, next) => {
  try {
    const { name, bio, avatar, notificationPreferences } = req.body;

    if (name !== undefined) req.user.name = name;
    if (bio !== undefined) req.user.bio = bio;
    if (avatar !== undefined) req.user.avatar = avatar;
    if (notificationPreferences !== undefined) {
      req.user.notificationPreferences = {
        ...req.user.notificationPreferences.toObject(),
        ...notificationPreferences,
      };
    }

    await req.user.save();

    res.json({ user: req.user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

// @desc    Upload/replace current user's avatar image
// @route   POST /api/auth/avatar
const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    req.user.avatar = `/uploads/${req.file.filename}`;
    await req.user.save();

    res.json({ user: req.user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

// @desc    Save onboarding interests + preferred languages
// @route   PUT /api/auth/interests
const updateInterests = async (req, res, next) => {
  try {
    const { interests, preferredLanguages } = req.body;

    req.user.interests = interests;
    if (preferredLanguages) req.user.preferredLanguages = preferredLanguages;
    req.user.onboarded = true;

    await req.user.save();

    res.json({ user: req.user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

// @desc    Request a password reset code (dev: code logged/returned, no real email)
// @route   POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select(EMAIL_OTP_SELECT);

    // Always respond the same way so we don't leak which emails are registered.
    const genericResponse = { message: 'If that email exists, a reset code has been sent' };
    if (!user) return res.json(genericResponse);

    const devOtp = await issueAndSendOtp(user, 'reset', {
      subject: 'Reset your BlogManthan password',
      bodyPrefix: 'Your BlogManthan password reset code is',
    });

    res.json({ ...genericResponse, devOtp });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
};

// @desc    Reset password using the OTP emailed by forgot-password
// @route   POST /api/auth/reset-password-otp
const resetPasswordOtp = async (req, res, next) => {
  try {
    const { email, code, password } = req.body;
    const user = await User.findOne({ email: (email || '').toLowerCase() }).select(EMAIL_OTP_SELECT);
    if (!user) {
      return res.status(400).json({ message: 'Incorrect code' });
    }

    await consumeOtp(user, 'reset', code);

    user.password = password;
    await user.save();

    res.json({ message: 'Password has been reset, you can now log in' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
};

// @desc    Get this user's private RSS feed URL
// @route   GET /api/auth/feed-url
const getFeedUrl = async (req, res, next) => {
  try {
    const apiBase = `${req.protocol}://${req.get('host')}`;
    res.json({ feedUrl: `${apiBase}/api/feed/${req.user.feedToken}.rss` });
  } catch (err) {
    next(err);
  }
};

const DEACTIVATION_DAYS = [14, 21, 30];

// @desc    Temporarily deactivate the current user's account — their posts,
//          comments, and activity are hidden until the chosen period elapses
//          (or forever, until they log back in after it does).
// @route   POST /api/auth/deactivate
const deactivateAccount = async (req, res, next) => {
  try {
    const days = Number(req.body.days);
    if (!DEACTIVATION_DAYS.includes(days)) {
      return res.status(400).json({ message: 'Choose a deactivation period of 14, 21, or 30 days' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (user.password && !(await user.comparePassword(req.body.password || ''))) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    user.accountStatus = 'deactivated';
    user.deactivatedAt = new Date();
    user.deactivatedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    await user.save();

    res.json({ message: 'Account deactivated', deactivatedUntil: user.deactivatedUntil });
  } catch (err) {
    next(err);
  }
};

// @desc    Permanently delete the current user's account and their content
// @route   DELETE /api/auth/account
const deleteAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+password');
    if (user.password && !(await user.comparePassword(req.body.password || ''))) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    const userId = user._id;
    const postIds = (await Post.find({ author: userId }).select('_id')).map((p) => p._id);

    await Promise.all([
      Comment.deleteMany({ $or: [{ user: userId }, { post: { $in: postIds } }] }),
      Post.deleteMany({ author: userId }),
      Notification.deleteMany({ $or: [{ recipient: userId }, { actor: userId }] }),
      Report.deleteMany({ reporter: userId }),
      Post.updateMany({ likes: userId }, { $pull: { likes: userId } }),
      Comment.updateMany({ likes: userId }, { $pull: { likes: userId } }),
      User.updateMany({ following: userId }, { $pull: { following: userId } }),
      // Bookmarks live on User docs referencing Post ids, so anyone who
      // bookmarked one of this user's now-deleted posts needs it pulled too.
      User.updateMany({ bookmarks: { $in: postIds } }, { $pull: { bookmarks: { $in: postIds } } }),
    ]);

    await user.deleteOne();

    res.json({ message: 'Account deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
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
};
