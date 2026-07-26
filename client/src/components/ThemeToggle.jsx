import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';

const OPTIONS = [
  { value: 'light', labelKey: 'themeToggle.light', icon: Sun },
  { value: 'dark', labelKey: 'themeToggle.dark', icon: Moon },
  { value: 'system', labelKey: 'themeToggle.system', icon: Monitor },
];

const ThemeToggle = () => {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const current = OPTIONS.find((o) => o.value === theme) || OPTIONS[2];
  const CurrentIcon = current.icon;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t('themeToggle.toggle')}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
      >
        <CurrentIcon size={17} strokeWidth={2} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-36 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-soft py-1.5 z-20 animate-fadeIn"
        >
          {OPTIONS.map(({ value, labelKey, icon: Icon }) => (
            <button
              key={value}
              role="menuitem"
              onClick={() => {
                setTheme(value);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-slate-700/60 hover:text-brand-700 dark:hover:text-brand-300"
            >
              <Icon size={15} />
              <span className="flex-1 text-left">{t(labelKey)}</span>
              {theme === value && <Check size={14} className="text-brand-600 dark:text-brand-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ThemeToggle;
