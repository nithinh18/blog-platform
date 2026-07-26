import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Mail, Rss, Copy } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  updateProfile,
  updateInterests,
  resendVerification,
  verifyEmailOtp,
  getFeedUrl,
} from '../services/authService';
import { CATEGORIES } from '../utils/categoryStyles.js';
import { UI_LANGUAGES } from '../i18n/index.js';
import { isValidName } from '../utils/validation.js';
import AvatarUpload from '../components/AvatarUpload.jsx';
import TwoFactorSettings from '../components/TwoFactorSettings.jsx';
import DeleteAccountSection from '../components/DeleteAccountSection.jsx';

const NOTIFICATION_TYPES = ['comment', 'reply', 'like', 'follow'];

const Profile = () => {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', bio: user?.bio || '' });
  const [interests, setInterests] = useState(user?.interests || []);
  const [languages, setLanguages] = useState(user?.preferredLanguages || ['en']);
  const [notificationPreferences, setNotificationPreferences] = useState(
    user?.notificationPreferences || { comment: true, reply: true, like: true, follow: true }
  );
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [feedUrl, setFeedUrl] = useState('');

  const [nameTouched, setNameTouched] = useState(false);
  const nameValid = isValidName(form.name);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const toggleInterest = (c) =>
    setInterests((prev) => (prev.includes(c) ? prev.filter((i) => i !== c) : [...prev, c]));

  const toggleLanguage = (code) =>
    setLanguages((prev) => (prev.includes(code) ? prev.filter((l) => l !== code) : [...prev, code]));

  const toggleNotificationPref = (key) =>
    setNotificationPreferences((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setNameTouched(true);

    if (!nameValid) {
      setError(t('auth.nameInvalid'));
      return;
    }

    setSubmitting(true);
    try {
      // Sequential, not parallel — both requests save the same user document,
      // and running them concurrently risks one overwriting the other's change.
      await updateProfile({ ...form, notificationPreferences });
      const interestData = await updateInterests({
        interests,
        preferredLanguages: languages.length ? languages : ['en'],
      });
      updateUser(interestData.user);
      setMessage(t('profile.updated'));
    } catch (err) {
      setError(err.response?.data?.message || t('profile.updateFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    setVerifyMessage(t('profile.sending'));
    try {
      const data = await resendVerification();
      setDevOtp(data.devOtp || '');
      setVerifyMessage(t('profile.verificationSent'));
    } catch (err) {
      setVerifyMessage(err.response?.data?.message || t('profile.couldNotResend'));
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setVerifyMessage('');
    setOtpVerifying(true);
    try {
      const data = await verifyEmailOtp(otpCode.trim());
      updateUser(data.user);
      setOtpCode('');
      setDevOtp('');
    } catch (err) {
      setVerifyMessage(err.response?.data?.message || t('otp.invalidCode'));
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleGetFeedUrl = async () => {
    const data = await getFeedUrl();
    setFeedUrl(data.feedUrl);
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-12 space-y-5">
      <div className="flex flex-col items-center mb-2">
        <AvatarUpload user={user} onUpdated={updateUser} />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-3">{t('profile.title')}</h1>
      </div>

      {!user?.emailVerified && (
        <div className="bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 text-sm px-4 py-3 rounded-lg space-y-2">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <Mail size={15} /> {t('profile.emailNotVerified')}
            </span>
            <button onClick={handleResendVerification} className="font-semibold hover:underline shrink-0">
              {t('profile.resend')}
            </button>
          </div>
          {devOtp && (
            <p className="text-xs">
              <span className="font-semibold">{t('auth.devModeLabel')}</span> {t('otp.devCodeLabel')}{' '}
              <span className="font-mono font-semibold">{devOtp}</span>
            </p>
          )}
          <form onSubmit={handleVerifyOtp} className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="flex-1 rounded-lg border border-amber-200 dark:border-amber-500/30 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              type="submit"
              disabled={otpVerifying || otpCode.length !== 6}
              className="text-xs font-semibold bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700 disabled:opacity-50 shrink-0"
            >
              {otpVerifying ? t('otp.verifying') : t('otp.verifyEmailCta')}
            </button>
          </form>
        </div>
      )}
      {verifyMessage && <p className="text-xs text-slate-500 dark:text-slate-400">{verifyMessage}</p>}

      <form
        onSubmit={handleSubmit}
        className="space-y-5 bg-white dark:bg-slate-900 p-7 rounded-lg border border-slate-200 dark:border-slate-800"
      >
        {message && (
          <div className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-sm px-4 py-2.5 rounded-xl">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 text-sm px-4 py-2.5 rounded-xl">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-200">
            {t('auth.email')}
          </label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 px-4 py-2.5 text-sm text-slate-500 dark:text-slate-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-200">
            {t('auth.name')}
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            onBlur={() => setNameTouched(true)}
            className={`w-full rounded-xl border bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:bg-white dark:focus:bg-slate-900 ${
              nameTouched && !nameValid
                ? 'border-rose-300 dark:border-rose-500/50 focus:ring-rose-500'
                : 'border-slate-200 dark:border-slate-700 focus:ring-brand-500'
            }`}
          />
          {nameTouched && !nameValid && (
            <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{t('auth.nameInvalid')}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-200">
            {t('profile.bio')}
          </label>
          <textarea
            name="bio"
            value={form.bio}
            onChange={handleChange}
            rows={3}
            placeholder={t('profile.bioPlaceholder')}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-900"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-200">
            {t('profile.interests')}
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const active = interests.includes(c);
              return (
                <button
                  type="button"
                  key={c}
                  onClick={() => toggleInterest(c)}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    active
                      ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500'
                  }`}
                >
                  {active && <Check size={12} />}
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-200">
            {t('profile.languages')}
          </label>
          <div className="flex flex-wrap gap-2">
            {UI_LANGUAGES.map(({ code, name }) => {
              const active = languages.includes(code);
              return (
                <button
                  type="button"
                  key={code}
                  onClick={() => toggleLanguage(code)}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    active
                      ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500'
                  }`}
                >
                  {active && <Check size={12} />}
                  {name}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-200">
            {t('profile.notifyMeAbout')}
          </label>
          <div className="space-y-2">
            {NOTIFICATION_TYPES.map((key) => (
              <label key={key} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={Boolean(notificationPreferences[key])}
                  onChange={() => toggleNotificationPref(key)}
                  className="rounded border-slate-300 dark:border-slate-600 text-brand-600 focus:ring-brand-500"
                />
                {t(`profile.notificationTypes.${key}`)}
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-brand-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50"
        >
          {submitting ? t('post.saving') : t('profile.saveChanges')}
        </button>
      </form>

      <div className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
          {t('profile.twoFactorHeading')}
        </h2>
        <TwoFactorSettings user={user} onUpdated={updateUser} />
      </div>

      <div className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
          <Rss size={14} /> {t('profile.rssHeading')}
        </h2>
        {feedUrl ? (
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={feedUrl}
              className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-500"
            />
            <button
              onClick={() => navigator.clipboard?.writeText(feedUrl)}
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Copy size={13} />
            </button>
          </div>
        ) : (
          <button
            onClick={handleGetFeedUrl}
            className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
          >
            {t('profile.getFeedUrl')}
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">{t('profile.dangerZone')}</h2>
        <DeleteAccountSection />
      </div>
    </div>
  );
};

export default Profile;
