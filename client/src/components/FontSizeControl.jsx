import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Minus, Plus } from 'lucide-react';

const MIN = 90;
const MAX = 130;
const STEP = 10;
const STORAGE_KEY = 'readingFontScale';

const applyScale = (scale) => {
  document.documentElement.style.setProperty('--reading-font-scale', `${scale}%`);
};

const FontSizeControl = () => {
  const { t } = useTranslation();
  const [scale, setScale] = useState(() => Number(localStorage.getItem(STORAGE_KEY)) || 100);

  useEffect(() => {
    applyScale(scale);
    localStorage.setItem(STORAGE_KEY, String(scale));
  }, [scale]);

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-700 p-0.5">
      <button
        onClick={() => setScale((s) => Math.max(MIN, s - STEP))}
        disabled={scale <= MIN}
        className="h-6 w-6 inline-flex items-center justify-center rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
        aria-label={t('fontSize.decrease')}
      >
        <Minus size={11} />
      </button>
      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 w-7 text-center">
        {scale}%
      </span>
      <button
        onClick={() => setScale((s) => Math.min(MAX, s + STEP))}
        disabled={scale >= MAX}
        className="h-6 w-6 inline-flex items-center justify-center rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
        aria-label={t('fontSize.increase')}
      >
        <Plus size={11} />
      </button>
    </div>
  );
};

export default FontSizeControl;
