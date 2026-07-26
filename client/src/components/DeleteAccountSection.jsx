import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Trash2, MoonStar, ChevronLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { deleteAccount, deactivateAccount } from '../services/authService';

const DEACTIVATION_DAYS = [14, 21, 30];

const DeleteAccountSection = () => {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('idle'); // idle | choose | deactivate | delete
  const [days, setDays] = useState(14);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setMode('idle');
    setPassword('');
    setError('');
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await deleteAccount(password);
      logout();
      navigate('/register');
    } catch (err) {
      setError(err.response?.data?.message || t('deleteAccount.genericError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await deactivateAccount(password, days);
      logout();
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || t('deleteAccount.deactivateFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (mode === 'idle') {
    return (
      <button
        onClick={() => setMode('choose')}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-rose-600 dark:text-rose-400 hover:underline"
      >
        <Trash2 size={14} /> {t('deleteAccount.cta')}
      </button>
    );
  }

  if (mode === 'choose') {
    return (
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {t('deleteAccount.chooseTitle')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('deleteAccount.chooseSubtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setMode('deactivate')}
          className="w-full text-left rounded-xl border border-slate-200 dark:border-slate-700 hover:border-brand-400 dark:hover:border-brand-500 px-4 py-3 transition-colors"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
            <MoonStar size={14} /> {t('deleteAccount.deactivateOption')}
          </span>
          <span className="block text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('deleteAccount.deactivateDesc')}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMode('delete')}
          className="w-full text-left rounded-xl border border-rose-200 dark:border-rose-500/30 hover:border-rose-400 dark:hover:border-rose-500 px-4 py-3 transition-colors"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-rose-600 dark:text-rose-400">
            <Trash2 size={14} /> {t('deleteAccount.deleteOption')}
          </span>
          <span className="block text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('deleteAccount.deleteDesc')}
          </span>
        </button>

        <button
          type="button"
          onClick={reset}
          className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:underline"
        >
          {t('deleteAccount.cancel')}
        </button>
      </div>
    );
  }

  if (mode === 'deactivate') {
    return (
      <form onSubmit={handleDeactivate} className="space-y-3">
        <button
          type="button"
          onClick={() => setMode('choose')}
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:underline"
        >
          <ChevronLeft size={13} /> {t('deleteAccount.back')}
        </button>

        <p className="text-sm text-amber-600 dark:text-amber-400">
          {t('deleteAccount.deactivateWarning')}
        </p>
        {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

        <div>
          <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-200">
            {t('deleteAccount.choosePeriod')}
          </label>
          <div className="flex gap-2">
            {DEACTIVATION_DAYS.map((d) => (
              <button
                type="button"
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  days === d
                    ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500'
                }`}
              >
                {t(`deleteAccount.days${d}`)}
              </button>
            ))}
          </div>
        </div>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('deleteAccount.confirmPasswordPlaceholder')}
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? t('deleteAccount.deactivating') : t('deleteAccount.deactivateCta')}
          </button>
          <button
            type="button"
            onClick={reset}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            {t('deleteAccount.cancel')}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleDelete} className="space-y-3">
      <button
        type="button"
        onClick={() => setMode('choose')}
        className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:underline"
      >
        <ChevronLeft size={13} /> {t('deleteAccount.back')}
      </button>

      <p className="text-sm text-rose-600 dark:text-rose-400">{t('deleteAccount.warning')}</p>
      {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder={t('deleteAccount.confirmPasswordPlaceholder')}
        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-rose-700 disabled:opacity-50"
        >
          {submitting ? t('deleteAccount.deleting') : t('deleteAccount.permanentlyDelete')}
        </button>
        <button
          type="button"
          onClick={reset}
          className="px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          {t('deleteAccount.cancel')}
        </button>
      </div>
    </form>
  );
};

export default DeleteAccountSection;
