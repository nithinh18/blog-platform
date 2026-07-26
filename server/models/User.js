const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { CATEGORIES, LANGUAGE_CODES } = require('../config/constants');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 60,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      // Mirrors the strict Gmail-only rule enforced in
      // server/validators/authValidators.js — kept here too as a schema-level
      // guard against any write path that bypasses the request validator.
      match: [/^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]{0,63}[a-zA-Z0-9])?@gmail\.com$/, 'Please provide a valid Gmail address'],
    },
    password: {
      // Not required for Google-only accounts (authProvider: 'google') —
      // they authenticate via Google and may never set a local password.
      type: String,
      required: [
        function () {
          return this.authProvider !== 'google';
        },
        'Password is required',
      ],
      minlength: 8,
      select: false,
    },

    // 'google' accounts were created (or linked) via Sign in with Google —
    // see googleAuth() in authController. googleId is Google's stable
    // per-account subject id ("sub" claim).
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
    googleId: { type: String, select: false, index: true, sparse: true, unique: true },
    bio: {
      type: String,
      default: '',
      maxlength: 300,
    },
    avatar: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    // Self-service, time-boxed deactivation (see deleteAccount/deactivateAccount
    // in authController). While deactivated, the account can't log in and all
    // of its posts/comments/activity are hidden from other users; it reverts
    // to 'active' automatically once deactivatedUntil passes — checked lazily,
    // the same pattern as Post.isLive() for scheduled posts.
    accountStatus: {
      type: String,
      enum: ['active', 'deactivated'],
      default: 'active',
    },
    deactivatedAt: { type: Date, default: null },
    deactivatedUntil: { type: Date, default: null },
    interests: {
      type: [String],
      enum: CATEGORIES,
      default: [],
    },
    onboarded: {
      type: Boolean,
      default: false,
    },
    preferredLanguages: {
      type: [String],
      enum: LANGUAGE_CODES,
      default: ['en'],
    },
    bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // Email verification (soft gate — tracked and nudged in the UI, but not
    // required to log in, so it can't lock anyone out of an existing account).
    emailVerified: { type: Boolean, default: false },

    // Shared one-time-code state — see server/services/otpService.js. One
    // subsystem powers signup verification, password reset, passwordless
    // login, and email-based 2FA; `emailOtpPurpose` scopes a code to the
    // flow it was issued for.
    emailOtpHash: { type: String, select: false },
    emailOtpPurpose: {
      type: String,
      enum: ['verify', 'reset', 'login', '2fa'],
      select: false,
    },
    emailOtpExpires: { type: Date, select: false },
    emailOtpAttempts: { type: Number, default: 0, select: false },
    emailOtpLastSentAt: { type: Date, select: false },

    // Two-factor authentication — either a self-hosted TOTP authenticator
    // app, or a code emailed via the OTP subsystem above.
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorMethod: { type: String, enum: ['totp', 'email'], default: 'totp' },
    twoFactorSecret: { type: String, select: false },
    twoFactorTempSecret: { type: String, select: false },
    twoFactorBackupCodes: { type: [String], select: false, default: [] },

    notificationPreferences: {
      comment: { type: Boolean, default: true },
      reply: { type: Boolean, default: true },
      like: { type: Boolean, default: true },
      follow: { type: Boolean, default: true },
    },

    // A private, unguessable token for this user's personal RSS feed. The
    // site otherwise requires a logged-in session for every page, so the
    // feed can't be anonymous/public like a normal blog's — instead it's
    // accessed as /api/feed/:feedToken.rss, scoped to what that user can see.
    feedToken: {
      type: String,
      default: () => crypto.randomBytes(24).toString('hex'),
      unique: true,
      index: true,
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.isDeactivated = function () {
  return (
    this.accountStatus === 'deactivated' &&
    Boolean(this.deactivatedUntil) &&
    this.deactivatedUntil > new Date()
  );
};

// Clears a deactivation whose window has already passed. Called lazily
// wherever a deactivated account is looked up, instead of a cron job.
userSchema.methods.reactivateIfExpired = async function () {
  if (
    this.accountStatus === 'deactivated' &&
    (!this.deactivatedUntil || this.deactivatedUntil <= new Date())
  ) {
    this.accountStatus = 'active';
    this.deactivatedAt = null;
    this.deactivatedUntil = null;
    await this.save();
  }
};

// IDs of every currently-deactivated user, for excluding their posts/comments
// from public queries — see Post.visibleFilter().
userSchema.statics.deactivatedIds = async function () {
  const rows = await this.find({
    accountStatus: 'deactivated',
    deactivatedUntil: { $gt: new Date() },
  }).select('_id');
  return rows.map((r) => r._id);
};

userSchema.methods.toSafeObject = function () {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    bio: this.bio,
    avatar: this.avatar,
    role: this.role,
    interests: this.interests,
    onboarded: this.onboarded,
    preferredLanguages: this.preferredLanguages,
    bookmarks: this.bookmarks,
    following: this.following,
    emailVerified: this.emailVerified,
    twoFactorEnabled: this.twoFactorEnabled,
    twoFactorMethod: this.twoFactorMethod,
    authProvider: this.authProvider,
    notificationPreferences: this.notificationPreferences,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
