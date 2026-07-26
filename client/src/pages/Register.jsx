import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Feather, User, Mail, Lock, MailCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import PasswordChecklist from '../components/PasswordChecklist.jsx';
import { isValidEmail, isValidName, isPasswordStrict } from '../utils/validation.js';
import { verifyEmailOtp, resendVerification } from '../services/authService';

const Register = () => {
  const { t } = useTranslation();
  const { register, updateUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [touched, setTouched] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [step, setStep] = useState('form'); // form | verify
  const [otpCode, setOtpCode] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpMessage, setOtpMessage] = useState('');
  const [otpSubmitting, setOtpSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleBlur = (e) => setTouched({ ...touched, [e.target.name]: true });

  const nameValid = isValidName(form.name);
  const emailValid = isValidEmail(form.email);
  const passwordValid = isPasswordStrict(form.password);
  const passwordContainsEmail =
    form.email && form.password.toLowerCase().includes(form.email.split('@')[0].toLowerCase());
  const formValid = nameValid && emailValid && passwordValid && !passwordContainsEmail;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setTouched({ name: true, email: true, password: true });

    if (!formValid) {
      setError(t('auth.fixHighlightedFields'));
      return;
    }

    setSubmitting(true);
    try {
      const { devOtp: code } = await register(form);
      setDevOtp(code || '');
      setStep('verify');
    } catch (err) {
      setError(err.response?.data?.message || t('auth.registrationFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setOtpError('');
    setOtpSubmitting(true);
    try {
      const data = await verifyEmailOtp(otpCode.trim());
      updateUser(data.user);
      navigate('/onboarding');
    } catch (err) {
      setOtpError(err.response?.data?.message || t('otp.invalidCode'));
    } finally {
      setOtpSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    setOtpError('');
    setOtpMessage('');
    try {
      const data = await resendVerification();
      setDevOtp(data.devOtp || '');
      setOtpMessage(t('otp.codeResent'));
    } catch (err) {
      setOtpError(err.response?.data?.message || t('otp.resendFailed'));
    }
  };

  if (step === 'verify') {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-hero-glow dark:bg-slate-950 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-6">
            <span className="h-11 w-11 rounded-lg bg-slate-900 dark:bg-white flex items-center justify-center mb-3">
              <MailCheck size={20} className="text-white dark:text-slate-900" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('otp.verifyEmailTitle')}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 text-center">
              {t('otp.verifyEmailSubtitle', { email: form.email })}
            </p>
          </div>

          <form
            onSubmit={handleVerifyOtp}
            className="space-y-4 bg-white dark:bg-slate-900 p-7 rounded-lg border border-slate-200 dark:border-slate-800"
          >
            {devOtp && (
              <div className="bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs px-4 py-2.5 rounded-xl">
                <span className="font-semibold">{t('auth.devModeLabel')}</span> {t('otp.devCodeLabel')}{' '}
                <span className="font-mono font-semibold">{devOtp}</span>
              </div>
            )}
            {otpMessage && (
              <div className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-sm px-4 py-2.5 rounded-xl">
                {otpMessage}
              </div>
            )}
            {otpError && (
              <div className="bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 text-sm px-4 py-2.5 rounded-xl">
                {otpError}
              </div>
            )}

            <input
              type="text"
              inputMode="numeric"
              autoFocus
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="w-full text-center tracking-[0.5em] text-lg px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-900"
            />

            <button
              type="submit"
              disabled={otpSubmitting || otpCode.length !== 6}
              className="w-full bg-brand-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50"
            >
              {otpSubmitting ? t('otp.verifying') : t('otp.verifyEmailCta')}
            </button>

            <button
              type="button"
              onClick={handleResendOtp}
              className="w-full text-sm text-brand-600 dark:text-brand-400 hover:underline"
            >
              {t('otp.resendCode')}
            </button>
          </form>

          <p className="text-sm text-center text-slate-500 dark:text-slate-400 mt-5">
            <button
              type="button"
              onClick={() => navigate('/onboarding')}
              className="text-brand-600 dark:text-brand-400 font-medium hover:underline"
            >
              {t('otp.skipForNow')}
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-hero-glow dark:bg-slate-950 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <span className="h-11 w-11 rounded-lg bg-slate-900 dark:bg-white flex items-center justify-center mb-3">
            <Feather size={20} className="text-white dark:text-slate-900" />
          </span>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t('auth.createAccount')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('auth.registerSubtitle')}</p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-4 bg-white dark:bg-slate-900 p-7 rounded-lg border border-slate-200 dark:border-slate-800"
        >
          {error && (
            <div className="bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 text-sm px-4 py-2.5 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-200">
              {t('auth.name')}
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Jane Doe"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:bg-white dark:focus:bg-slate-900 ${
                  touched.name && !nameValid
                    ? 'border-rose-300 dark:border-rose-500/50 focus:ring-rose-500'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-brand-500'
                }`}
              />
            </div>
            {touched.name && !nameValid && (
              <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                {t('auth.nameInvalid')}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-200">
              {t('auth.email')}
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="you@gmail.com"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:bg-white dark:focus:bg-slate-900 ${
                  touched.email && !emailValid
                    ? 'border-rose-300 dark:border-rose-500/50 focus:ring-rose-500'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-brand-500'
                }`}
              />
            </div>
            {touched.email && !emailValid && (
              <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                {t('auth.invalidEmail')}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-200">
              {t('auth.password')}
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={t('auth.strongPasswordPlaceholder')}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:bg-white dark:focus:bg-slate-900 ${
                  touched.password && !passwordValid
                    ? 'border-rose-300 dark:border-rose-500/50 focus:ring-rose-500'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-brand-500'
                }`}
              />
            </div>
            <PasswordChecklist password={form.password} />
            {touched.password && passwordContainsEmail && (
              <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                {t('auth.passwordContainsEmail')}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50"
          >
            {submitting ? t('auth.creatingAccount') : t('auth.register')}
          </button>
        </form>

        <p className="text-sm text-center text-slate-500 dark:text-slate-400 mt-5">
          {t('auth.haveAccount')}{' '}
          <Link to="/login" className="text-brand-600 dark:text-brand-400 font-medium hover:underline">
            {t('auth.logIn')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
