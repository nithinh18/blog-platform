import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { CATEGORIES } from '../utils/categoryStyles.js';
import { UI_LANGUAGES } from '../i18n/index.js';
import { getSearchSuggestions } from '../services/postService';

const SearchBar = ({ onSearch, onCategoryChange, category, onLanguageChange, language }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [term, setTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!term.trim()) {
      setSuggestions([]);
      return undefined;
    }

    const handle = setTimeout(() => {
      getSearchSuggestions(term.trim())
        .then((data) => setSuggestions(data.posts))
        .catch(() => setSuggestions([]));
    }, 250);

    return () => clearTimeout(handle);
  }, [term]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    onSearch(term.trim());
  };

  return (
    <div className="mb-10" ref={ref}>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            id="global-search-input"
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            placeholder={t('search.placeholder')}
            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 mt-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-soft overflow-hidden z-20 animate-fadeIn">
              {suggestions.map((p) => (
                <button
                  key={p._id}
                  type="button"
                  onClick={() => {
                    setShowSuggestions(false);
                    setTerm('');
                    navigate(`/posts/${p._id}`);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-brand-50 dark:hover:bg-slate-800 border-b border-slate-50 dark:border-slate-800 last:border-0"
                >
                  <span className="font-medium text-slate-800 dark:text-slate-100">{p.title}</span>
                  <span className="block text-xs text-slate-400">{p.category}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">{t('search.allCategories')}</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {onLanguageChange && (
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">{t('search.allLanguages')}</option>
            {UI_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </select>
        )}

        <button
          type="submit"
          className="bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors"
        >
          {t('search.button')}
        </button>
      </form>
    </div>
  );
};

export default SearchBar;
