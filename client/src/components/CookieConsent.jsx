import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Cookie } from 'lucide-react';

const STORAGE_KEY = 'cookieConsent';

const CookieConsent = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 shadow-soft">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
        <Cookie size={18} className="shrink-0 text-slate-400" />
        <p className="flex-1 text-sm text-slate-600 dark:text-slate-300 text-center sm:text-left">
          {t('cookieConsent.text')}{' '}
          <Link to="/privacy" className="text-brand-600 dark:text-brand-400 hover:underline">
            {t('cookieConsent.privacyPolicy')}
          </Link>
          .
        </p>
        <button
          onClick={accept}
          className="shrink-0 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-700 transition-colors"
        >
          {t('cookieConsent.accept')}
        </button>
      </div>
    </div>
  );
};

export default CookieConsent;
