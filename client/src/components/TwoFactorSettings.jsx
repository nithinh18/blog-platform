import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, ShieldOff, Copy, Smartphone, Mail } from 'lucide-react';
import {
  setupTwoFactor,
  enableTwoFactor,
  setupEmailTwoFactor,
  confirmEmailTwoFactor,
  disableTwoFactor,
} from '../services/authService';

const TwoFactorSettings = ({ user, onUpdated }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState('idle'); // idle | choose | setup | email-setup | backup-codes | disable
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [code, setCode] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [password, setPassword] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const startTotpSetup = async () => {
    setError('');
    setSubmitting(true);
    try {
      const data = await setupTwoFactor();
      setQrCodeDataUrl(data.qrCodeDataUrl);
      setStep('setup');
    } catch (err) {
      setError(err.response?.data?.message || t('twoFactor.couldNotStart'));
    } finally {
      setSubmitting(false);
    }
  };

  const startEmailSetup = async () => {
    setError('');
    setSubmitting(true);
    try {
      const data = await setupEmailTwoFactor();
      setDevOtp(data.devOtp || '');
      setStep('email-setup');
    } catch (err) {
      setError(err.response?.data?.message || t('twoFactor.couldNotStart'));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmEnable = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await enableTwoFactor(code);
      setBackupCodes(data.backupCodes);
      setStep('backup-codes');
      onUpdated({ ...user, twoFactorEnabled: true, twoFactorMethod: 'totp' });
    } catch (err) {
      setError(err.response?.data?.message || t('twoFactor.invalidCode'));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmEmailEnable = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await confirmEmailTwoFactor(code);
      setBackupCodes(data.backupCodes);
      setStep('backup-codes');
      onUpdated({ ...user, twoFactorEnabled: true, twoFactorMethod: 'email' });
    } catch (err) {
      setError(err.response?.data?.message || t('otp.invalidCode'));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDisable = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await disableTwoFactor(password);
      onUpdated({ ...user, twoFactorEnabled: false });
      setStep('idle');
      setPassword('');
    } catch (err) {
      setError(err.response?.data?.message || t('twoFactor.incorrectPassword'));
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'backup-codes') {
    return (
      <div className="space-y-3">
        <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
          {t('twoFactor.nowEnabled')}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t('twoFactor.backupHint')}
        </p>
        <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800 rounded-lg p-3 font-mono text-sm">
          {backupCodes.map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(backupCodes.join('\n'));
          }}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
        >
          <Copy size={12} /> {t('twoFactor.copyCodes')}
        </button>
        <button
          onClick={() => setStep('idle')}
          className="block w-full mt-2 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-lg py-2 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          {t('twoFactor.done')}
        </button>
      </div>
    );
  }

  if (step === 'choose') {
    return (
      <div className="space-y-2">
        {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
        <button
          type="button"
          onClick={startTotpSetup}
          disabled={submitting}
          className="w-full text-left rounded-xl border border-slate-200 dark:border-slate-700 hover:border-brand-400 dark:hover:border-brand-500 px-4 py-3 transition-colors"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
            <Smartphone size={14} /> {t('twoFactor.methodApp')}
          </span>
          <span className="block text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('twoFactor.methodAppDesc')}
          </span>
        </button>
        <button
          type="button"
          onClick={startEmailSetup}
          disabled={submitting}
          className="w-full text-left rounded-xl border border-slate-200 dark:border-slate-700 hover:border-brand-400 dark:hover:border-brand-500 px-4 py-3 transition-colors"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
            <Mail size={14} /> {t('twoFactor.methodEmail')}
          </span>
          <span className="block text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('twoFactor.methodEmailDesc')}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setStep('idle')}
          className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:underline"
        >
          {t('twoFactor.cancel')}
        </button>
      </div>
    );
  }

  if (step === 'setup') {
    return (
      <form onSubmit={confirmEnable} className="space-y-3">
        {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t('twoFactor.scanQr')}
        </p>
        {qrCodeDataUrl && (
          <img src={qrCodeDataUrl} alt="2FA QR code" className="h-40 w-40 rounded-lg border border-slate-200 dark:border-slate-700" />
        )}
        <input
          type="text"
          inputMode="numeric"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="123456"
          className="w-full text-center tracking-widest rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-brand-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-50"
          >
            {submitting ? t('twoFactor.verifying') : t('twoFactor.confirmEnable')}
          </button>
          <button
            type="button"
            onClick={() => setStep('idle')}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            {t('twoFactor.cancel')}
          </button>
        </div>
      </form>
    );
  }

  if (step === 'email-setup') {
    return (
      <form onSubmit={confirmEmailEnable} className="space-y-3">
        {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
        <p className="text-sm text-slate-600 dark:text-slate-300">{t('twoFactor.emailCodeHint')}</p>
        {devOtp && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            <span className="font-semibold">{t('auth.devModeLabel')}</span> {t('otp.devCodeLabel')}{' '}
            <span className="font-mono font-semibold">{devOtp}</span>
          </p>
        )}
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          placeholder="123456"
          className="w-full text-center tracking-widest rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting || code.length !== 6}
            className="flex-1 bg-brand-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-50"
          >
            {submitting ? t('twoFactor.verifying') : t('twoFactor.confirmEnable')}
          </button>
          <button
            type="button"
            onClick={() => setStep('idle')}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            {t('twoFactor.cancel')}
          </button>
        </div>
      </form>
    );
  }

  if (step === 'disable') {
    return (
      <form onSubmit={confirmDisable} className="space-y-3">
        {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('twoFactor.confirmPasswordPlaceholder')}
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-rose-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-rose-700 disabled:opacity-50"
          >
            {submitting ? t('twoFactor.disabling') : t('twoFactor.disableCta')}
          </button>
          <button
            type="button"
            onClick={() => setStep('idle')}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            {t('twoFactor.cancel')}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm">
        {user?.twoFactorEnabled ? (
          <ShieldCheck size={16} className="text-emerald-500" />
        ) : (
          <ShieldOff size={16} className="text-slate-400" />
        )}
        <span className="text-slate-600 dark:text-slate-300">
          {user?.twoFactorEnabled
            ? `${t('twoFactor.enabled')} · ${
                user.twoFactorMethod === 'email' ? t('twoFactor.methodEmail') : t('twoFactor.methodApp')
              }`
            : t('twoFactor.notEnabled')}
        </span>
      </div>
      {error && <p className="text-xs text-rose-500">{error}</p>}
      {user?.twoFactorEnabled ? (
        <button
          onClick={() => setStep('disable')}
          className="text-xs font-medium text-rose-600 dark:text-rose-400 hover:underline"
        >
          {t('twoFactor.disable')}
        </button>
      ) : (
        <button
          onClick={() => setStep('choose')}
          disabled={submitting}
          className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
        >
          {t('twoFactor.enable')}
        </button>
      )}
    </div>
  );
};

export default TwoFactorSettings;
