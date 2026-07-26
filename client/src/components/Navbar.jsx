import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Menu,
  X,
  PenSquare,
  LayoutDashboard,
  LogOut,
  Bookmark,
  ShieldCheck,
  Hash,
  Trophy,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import LanguageSwitcher from './LanguageSwitcher.jsx';
import NotificationBell from './NotificationBell.jsx';

const navLinkClass = ({ isActive }) =>
  `text-sm font-medium transition-colors ${
    isActive
      ? 'text-brand-600 dark:text-brand-400'
      : 'text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400'
  }`;

const initials = (name = '') =>
  name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const Navbar = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center group" onClick={() => setMobileOpen(false)}>
          <img
            src="/logo-wordmark.png"
            alt="BlogManthan"
            className="h-10 w-auto group-hover:scale-105 transition-transform"
          />
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <NavLink to="/" className={navLinkClass} end>
            {t('nav.home')}
          </NavLink>
          {user && (
            <>
              <NavLink to="/create-post" className={navLinkClass}>
                {t('nav.createPost')}
              </NavLink>
              <NavLink to="/dashboard" className={navLinkClass}>
                {t('nav.dashboard')}
              </NavLink>
              <NavLink to="/tags" className={navLinkClass}>
                {t('nav.tags')}
              </NavLink>
              <NavLink to="/leaderboard" className={navLinkClass}>
                {t('nav.leaderboard')}
              </NavLink>
              <NavLink to="/bookmarks" className={navLinkClass}>
                {t('nav.bookmarks')}
              </NavLink>
              {user.role === 'admin' && (
                <NavLink to="/admin" className={navLinkClass}>
                  {t('nav.admin')}
                </NavLink>
              )}
            </>
          )}
        </div>

        <div className="hidden md:flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />

          {user ? (
            <div className="flex items-center gap-1.5 pl-2 ml-1 border-l border-slate-200 dark:border-slate-800">
              <NotificationBell />
              <Link
                to="/profile"
                className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-400 pl-1"
              >
                <span className="h-8 w-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold flex items-center justify-center">
                  {initials(user.name) || 'U'}
                </span>
                {user.name?.split(' ')[0]}
              </Link>
              <button
                onClick={handleLogout}
                title={t('nav.logout')}
                className="h-9 w-9 inline-flex items-center justify-center rounded-full text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 transition-colors"
              >
                <LogOut size={17} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-3 ml-1 border-l border-slate-200 dark:border-slate-800">
              <Link
                to="/login"
                className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 px-3 py-1.5"
              >
                {t('nav.login')}
              </Link>
              <Link
                to="/register"
                className="text-sm font-semibold text-white bg-brand-600 px-4 py-1.5 rounded-lg hover:bg-brand-700 transition-colors"
              >
                {t('nav.getStarted')}
              </Link>
            </div>
          )}
        </div>

        <div className="flex md:hidden items-center gap-1.5">
          <LanguageSwitcher />
          <ThemeToggle />
          {user && <NotificationBell />}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="h-9 w-9 inline-flex items-center justify-center rounded-full text-slate-600 dark:text-slate-300"
            aria-label={t('nav.toggleMenu')}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-4 space-y-3 animate-fadeIn">
          <Link to="/" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            {t('nav.home')}
          </Link>
          {user ? (
            <>
              <Link
                to="/create-post"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                <PenSquare size={16} /> {t('nav.createPost')}
              </Link>
              <Link
                to="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                <LayoutDashboard size={16} /> {t('nav.dashboard')}
              </Link>
              <Link
                to="/tags"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                <Hash size={16} /> {t('nav.tags')}
              </Link>
              <Link
                to="/leaderboard"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                <Trophy size={16} /> {t('nav.leaderboard')}
              </Link>
              <Link
                to="/bookmarks"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                <Bookmark size={16} /> {t('nav.bookmarks')}
              </Link>
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  <ShieldCheck size={16} /> {t('nav.admin')}
                </Link>
              )}
              <Link
                to="/profile"
                onClick={() => setMobileOpen(false)}
                className="block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                {t('nav.profile')} ({user.name})
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm font-medium text-rose-600 dark:text-rose-400"
              >
                <LogOut size={16} /> {t('nav.logout')}
              </button>
            </>
          ) : (
            <div className="flex gap-3 pt-1">
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="flex-1 text-center text-sm font-medium border border-slate-300 dark:border-slate-700 rounded-lg py-2"
              >
                {t('nav.login')}
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                className="flex-1 text-center text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg py-2 transition-colors"
              >
                {t('nav.getStarted')}
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
