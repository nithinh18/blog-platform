const crypto = require('crypto');

// One OTP subsystem shared by every code-based flow: signup verification,
// password reset, passwordless login, and email-based 2FA — distinguished
// by `purpose` so a code issued for one can't be replayed against another.
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute between sends
const MAX_OTP_ATTEMPTS = 5;

const generateOtpCode = () => String(crypto.randomInt(0, 1000000)).padStart(6, '0');
const hashOtpCode = (code) => crypto.createHash('sha256').update(String(code)).digest('hex');

// Generates + stores a fresh OTP on the user doc for the given purpose and
// returns the raw code (caller is responsible for emailing it). `user` must
// have been fetched with the emailOtp* fields selected.
const issueOtp = async (user, purpose) => {
  // Only throttle re-requesting a code for the *same* purpose (e.g. mashing
  // "resend"). Switching flows — verify email, then forgot password — is a
  // legitimate new action and shouldn't be blocked by an unrelated cooldown.
  if (
    user.emailOtpPurpose === purpose &&
    user.emailOtpLastSentAt &&
    Date.now() - user.emailOtpLastSentAt.getTime() < OTP_RESEND_COOLDOWN_MS
  ) {
    const waitSeconds = Math.ceil(
      (OTP_RESEND_COOLDOWN_MS - (Date.now() - user.emailOtpLastSentAt.getTime())) / 1000
    );
    const err = new Error(`Please wait ${waitSeconds}s before requesting another code`);
    err.status = 429;
    throw err;
  }

  const code = generateOtpCode();
  user.emailOtpHash = hashOtpCode(code);
  user.emailOtpPurpose = purpose;
  user.emailOtpExpires = new Date(Date.now() + OTP_TTL_MS);
  user.emailOtpAttempts = 0;
  user.emailOtpLastSentAt = new Date();
  await user.save();
  return code;
};

// Verifies a submitted code against the given purpose and, on success,
// clears the OTP fields (the caller still needs to save() after making its
// own changes, e.g. emailVerified/password). Throws with `.status` set on
// failure so route handlers can just forward err.status/err.message.
const consumeOtp = async (user, purpose, submittedCode) => {
  if (!user.emailOtpHash || user.emailOtpPurpose !== purpose) {
    const err = new Error('No code was requested for this action');
    err.status = 400;
    throw err;
  }
  if (user.emailOtpAttempts >= MAX_OTP_ATTEMPTS) {
    const err = new Error('Too many incorrect attempts — request a new code');
    err.status = 429;
    throw err;
  }
  if (!user.emailOtpExpires || user.emailOtpExpires < new Date()) {
    const err = new Error('This code has expired — request a new one');
    err.status = 400;
    throw err;
  }
  if (user.emailOtpHash !== hashOtpCode(String(submittedCode || '').trim())) {
    user.emailOtpAttempts += 1;
    await user.save();
    const err = new Error('Incorrect code');
    err.status = 400;
    throw err;
  }

  user.emailOtpHash = undefined;
  user.emailOtpPurpose = undefined;
  user.emailOtpExpires = undefined;
  user.emailOtpAttempts = 0;
  user.emailOtpLastSentAt = undefined;
};

const EMAIL_OTP_SELECT = '+emailOtpHash +emailOtpPurpose +emailOtpExpires +emailOtpAttempts +emailOtpLastSentAt';

module.exports = { issueOtp, consumeOtp, EMAIL_OTP_SELECT, OTP_TTL_MS };
