import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Feather, Mail, KeyRound, Lock } from 'lucide-react';
import { forgotPassword, resetPasswordOtp } from '../services/authService';
import PasswordChecklist from '../components/PasswordChecklist.jsx';
import { isPasswordStrict } from '../utils/validation.js';

const ForgotPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState('request'); // request | reset
  const [email, setEmail] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const passwordValid = isPasswordStrict(password);

  const handleRequest = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await forgotPassword(email);
      setDevOtp(data.devOtp || '');
      setStep('reset');
    } catch (err) {
      setError(err.response?.data?.message || t('common.genericError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setTouched(true);

    if (!passwordValid) {
      setError(t('auth.meetPasswordRequirements'));
      return;
    }

    setSubmitting(true);
    try {
      await resetPasswordOtp(email, code.trim(), password);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || t('auth.resetFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-hero-glow dark:bg-slate-950 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <span className="h-11 w-11 rounded-lg bg-slate-900 dark:bg-white flex items-center justify-center mb-3">
            <Feather size={20} className="text-white dark:text-slate-900" />
          </span>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t('auth.resetPassword')}
          </h1>
        </div>

        {step === 'request' ? (
          <form
            onSubmit={handleRequest}
            className="space-y-4 bg-white dark:bg-slate-900 p-7 rounded-lg border border-slate-200 dark:border-slate-800"
          >
            {error && (
              <div className="bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 text-sm px-4 py-2.5 rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-200">
                {t('auth.email')}
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-brand-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50"
            >
              {submitting ? t('otp.sending') : t('otp.sendCode')}
            </button>
          </form>
        ) : (
          <form
            onSubmit={handleReset}
            noValidate
            className="space-y-4 bg-white dark:bg-slate-900 p-7 rounded-lg border border-slate-200 dark:border-slate-800"
          >
            {devOtp && (
              <div className="bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs px-4 py-2.5 rounded-xl">
                <span className="font-semibold">{t('auth.devModeLabel')}</span> {t('otp.devCodeLabel')}{' '}
                <span className="font-mono font-semibold">{devOtp}</span>
              </div>
            )}
            {error && (
              <div className="bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 text-sm px-4 py-2.5 rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-200">
                {t('otp.emailCodeTab')}
              </label>
              <div className="relative">
                <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  inputMode="numeric"
                  autoFocus
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full pl-10 pr-4 py-2.5 text-center tracking-[0.5em] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-200">
                {t('auth.newPassword')}
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched(true)}
                  placeholder={t('auth.strongPasswordPlaceholder')}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:bg-white dark:focus:bg-slate-900 ${
                    touched && !passwordValid
                      ? 'border-rose-300 dark:border-rose-500/50 focus:ring-rose-500'
                      : 'border-slate-200 dark:border-slate-700 focus:ring-brand-500'
                  }`}
                />
              </div>
              <PasswordChecklist password={password} />
            </div>

            <button
              type="submit"
              disabled={submitting || code.length !== 6}
              className="w-full bg-brand-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50"
            >
              {submitting ? t('otp.verifying') : t('auth.resetPassword')}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('request');
                setCode('');
                setError('');
              }}
              className="w-full text-sm text-slate-500 dark:text-slate-400 hover:underline"
            >
              {t('otp.useDifferentEmail')}
            </button>
          </form>
        )}

        <p className="text-sm text-center text-slate-500 dark:text-slate-400 mt-5">
          <Link to="/login" className="text-brand-600 dark:text-brand-400 font-medium hover:underline">
            {t('auth.backToLogin')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
