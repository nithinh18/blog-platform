import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sparkles, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { updateInterests } from '../services/authService';
import { CATEGORIES } from '../utils/categoryStyles.js';
import { UI_LANGUAGES } from '../i18n/index.js';

const Onboarding = () => {
  const { t } = useTranslation();
  const { updateUser } = useAuth();
  const navigate = useNavigate();
  const [interests, setInterests] = useState([]);
  const [languages, setLanguages] = useState(['en']);
  const [submitting, setSubmitting] = useState(false);

  const toggleInterest = (c) =>
    setInterests((prev) => (prev.includes(c) ? prev.filter((i) => i !== c) : [...prev, c]));

  const toggleLanguage = (code) =>
    setLanguages((prev) => (prev.includes(code) ? prev.filter((l) => l !== code) : [...prev, code]));

  const finish = async (skip = false) => {
    setSubmitting(true);
    try {
      const data = await updateInterests({
        interests: skip ? [] : interests,
        preferredLanguages: languages.length ? languages : ['en'],
      });
      updateUser(data.user);
      navigate('/');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-hero-glow dark:bg-slate-950 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-7 sm:p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <span className="h-11 w-11 rounded-lg bg-slate-900 dark:bg-white flex items-center justify-center mb-3">
            <Sparkles size={20} className="text-white dark:text-slate-900" />
          </span>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t('onboarding.title')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('onboarding.subtitle')}</p>
        </div>

        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {CATEGORIES.map((c) => {
            const active = interests.includes(c);
            return (
              <button
                key={c}
                onClick={() => toggleInterest(c)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  active
                    ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500'
                }`}
              >
                {active && <Check size={14} />}
                {c}
              </button>
            );
          })}
        </div>

        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 text-center">
          {t('onboarding.languageTitle')}
        </h2>
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {UI_LANGUAGES.map(({ code, name }) => {
            const active = languages.includes(code);
            return (
              <button
                key={code}
                onClick={() => toggleLanguage(code)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  active
                    ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500'
                }`}
              >
                {active && <Check size={14} />}
                {name}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => finish(false)}
            disabled={submitting}
            className="flex-1 bg-brand-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50"
          >
            {t('onboarding.continue')}
          </button>
          <button
            onClick={() => finish(true)}
            disabled={submitting}
            className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            {t('onboarding.skip')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
