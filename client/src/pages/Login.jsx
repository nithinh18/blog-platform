import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Feather, Mail, Lock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const Login = () => {
  const { t } = useTranslation();
  const { login, completeTwoFactorLogin } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [challengeToken, setChallengeToken] = useState('');
  const [challengeMethod, setChallengeMethod] = useState('totp');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const result = await login(form);
      if (result.requires2FA) {
        setChallengeToken(result.challengeToken);
        setChallengeMethod(result.method || 'totp');
      } else {
        navigate('/');
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.accountDeactivated) {
        setError(
          t('auth.accountDeactivatedUntil', {
            date: data.deactivatedUntil ? new Date(data.deactivatedUntil).toLocaleDateString() : '',
          })
        );
      } else {
        setError(data?.message || t('auth.loginFailed'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await completeTwoFactorLogin(challengeToken, code);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || t('twoFactor.invalidCode'));
    } finally {
      setSubmitting(false);
    }
  };

  if (challengeToken) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-hero-glow dark:bg-slate-950 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-6">
            <span className="h-11 w-11 rounded-lg bg-slate-900 dark:bg-white flex items-center justify-center mb-3">
              <ShieldCheck size={20} className="text-white dark:text-slate-900" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {t('auth.twoFactorVerification')}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 text-center">
              {challengeMethod === 'email' ? t('otp.twoFactorEmailHint') : t('auth.twoFactorCodeHint')}
            </p>
          </div>

          <form
            onSubmit={handleVerifyCode}
            className="space-y-4 bg-white dark:bg-slate-900 p-7 rounded-lg border border-slate-200 dark:border-slate-800"
          >
            {error && (
              <div className="bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 text-sm px-4 py-2.5 rounded-xl">
                {error}
              </div>
            )}
            <input
              type="text"
              inputMode="numeric"
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={challengeMethod === 'email' ? '123456' : t('auth.codeOrBackupPlaceholder')}
              className="w-full text-center tracking-widest text-lg px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-900"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-brand-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50"
            >
              {submitting ? t('auth.verifying') : t('auth.verifyAndLogin')}
            </button>
            <button
              type="button"
              onClick={() => {
                setChallengeToken('');
                setCode('');
                setError('');
              }}
              className="w-full text-sm text-slate-500 dark:text-slate-400 hover:underline"
            >
              {t('auth.backToLogin')}
            </button>
          </form>
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('auth.welcomeBack')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('auth.loginSubtitle')}</p>
        </div>

        <form
          onSubmit={handleSubmit}
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
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="you@gmail.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-900"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                {t('auth.password')}
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-brand-600 dark:text-brand-400 hover:underline"
              >
                {t('auth.forgotPassword')}
              </Link>
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50"
          >
            {submitting ? t('auth.loggingIn') : t('auth.logIn')}
          </button>
        </form>

        <p className="text-sm text-center text-slate-500 dark:text-slate-400 mt-5">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="text-brand-600 dark:text-brand-400 font-medium hover:underline">
            {t('auth.register')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
