import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Github, Twitter } from 'lucide-react';

const Footer = () => {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src="/logo-wordmark.png" alt="BlogManthan" className="h-7 w-auto" />
          <span className="text-sm text-slate-400 dark:text-slate-500">
            &copy; {new Date().getFullYear()}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
          <span>{t('footer.tagline')}</span>
          <Link to="/terms" className="hover:text-brand-600 dark:hover:text-brand-400">
            {t('footer.terms')}
          </Link>
          <Link to="/privacy" className="hover:text-brand-600 dark:hover:text-brand-400">
            {t('footer.privacy')}
          </Link>
        </div>

        <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500">
          <a href="#" className="hover:text-brand-600 dark:hover:text-brand-400" aria-label="Github">
            <Github size={16} />
          </a>
          <a href="#" className="hover:text-brand-600 dark:hover:text-brand-400" aria-label="Twitter">
            <Twitter size={16} />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
