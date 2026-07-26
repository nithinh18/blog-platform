import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';
import { UI_LANGUAGES } from '../i18n/index.js';

const LanguageSwitcher = () => {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const current = UI_LANGUAGES.find((l) => l.code === i18n.language) || UI_LANGUAGES[0];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t('nav.changeLanguage')}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1 h-9 px-2.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors text-xs font-semibold"
      >
        <Globe size={15} strokeWidth={2} />
        <span className="hidden sm:inline">{current.code.toUpperCase()}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-40 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-soft py-1.5 z-20 animate-fadeIn"
        >
          {UI_LANGUAGES.map(({ code, name }) => (
            <button
              key={code}
              role="menuitem"
              onClick={() => {
                i18n.changeLanguage(code);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-slate-700/60 hover:text-brand-700 dark:hover:text-brand-300"
            >
              <span className="flex-1 text-left">{name}</span>
              {i18n.language === code && (
                <Check size={14} className="text-brand-600 dark:text-brand-400" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
