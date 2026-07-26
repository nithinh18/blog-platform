import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

const getSystemPrefersDark = () =>
  window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

const applyTheme = (mode) => {
  const isDark = mode === 'dark' || (mode === 'system' && getSystemPrefersDark());
  document.documentElement.classList.toggle('dark', isDark);
};

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => localStorage.getItem('theme') || 'system');

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem('theme', theme);

    if (theme !== 'system') return undefined;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => applyTheme('system');
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [theme]);

  const setTheme = (mode) => setThemeState(mode);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
