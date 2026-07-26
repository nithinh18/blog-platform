import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Compass } from 'lucide-react';

const NotFound = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-hero-glow dark:bg-slate-950 flex items-center justify-center px-4">
      <div className="text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-lg bg-slate-900 dark:bg-white mb-5">
          <Compass size={24} className="text-white dark:text-slate-900" />
        </span>
        <h1 className="text-6xl font-bold text-brand-600 dark:text-brand-400 mb-3">404</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-6">{t('notFound.message')}</p>
        <Link
          to="/"
          className="inline-block bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors"
        >
          {t('notFound.goHome')}
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
