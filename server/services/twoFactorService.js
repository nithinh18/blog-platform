const { authenticator } = require('otplib');
const qrcode = require('qrcode');
const crypto = require('crypto');

const APP_NAME = 'BlogManthan';

const generateSecret = () => authenticator.generateSecret();

const buildQrCodeDataUrl = async (email, secret) => {
  const otpauth = authenticator.keyuri(email, APP_NAME, secret);
  return qrcode.toDataURL(otpauth);
};

const verifyToken = (token, secret) => {
  if (!token || !secret) return false;
  try {
    return authenticator.verify({ token: String(token).trim(), secret });
  } catch {
    return false;
  }
};

const generateBackupCodes = (count = 8) => {
  const codes = Array.from({ length: count }, () =>
    crypto.randomBytes(5).toString('hex').toUpperCase()
  );
  const hashed = codes.map((c) => crypto.createHash('sha256').update(c).digest('hex'));
  return { codes, hashed };
};

const hashBackupCode = (code) =>
  crypto
    .createHash('sha256')
    .update(String(code).trim().toUpperCase())
    .digest('hex');

module.exports = {
  generateSecret,
  buildQrCodeDataUrl,
  verifyToken,
  generateBackupCodes,
  hashBackupCode,
};
