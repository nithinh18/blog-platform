import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Bell, Heart, MessageCircle, UserPlus } from 'lucide-react';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../services/notificationService';

const ICONS = { comment: MessageCircle, reply: MessageCircle, like: Heart, follow: UserPlus };

const NotificationBell = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef(null);

  const load = () => {
    getNotifications()
      .then((data) => {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      })
      .catch(() => {});
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = () => {
    setOpen((o) => !o);
  };

  const handleItemClick = async (n) => {
    if (!n.read) {
      await markNotificationRead(n._id);
      setNotifications((prev) => prev.map((x) => (x._id === n._id ? { ...x, read: true } : x)));
      setUnreadCount((c) => Math.max(0, c - 1));
    }
  };

  const handleMarkAll = async () => {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const targetFor = (n) => {
    if (n.post) return `/posts/${n.post._id}`;
    if (n.type === 'follow' && n.actor) return `/authors/${n.actor._id}`;
    return '#';
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        aria-label={t('notifications.aria')}
        className="relative h-9 w-9 inline-flex items-center justify-center rounded-full text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 h-4 min-w-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-soft z-20 animate-fadeIn">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-700">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {t('notifications.title')}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAll}
                className="text-xs text-brand-600 dark:text-brand-400 hover:underline"
              >
                {t('notifications.markAllRead')}
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-8">
              {t('notifications.empty')}
            </p>
          ) : (
            notifications.map((n) => {
              const Icon = ICONS[n.type] || Bell;
              return (
                <Link
                  key={n._id}
                  to={targetFor(n)}
                  onClick={() => handleItemClick(n)}
                  className={`flex items-start gap-2.5 px-4 py-3 text-sm border-b border-slate-50 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/40 ${
                    !n.read ? 'bg-brand-50/50 dark:bg-brand-500/5' : ''
                  }`}
                >
                  <Icon size={15} className="mt-0.5 text-brand-500 shrink-0" />
                  <span className="text-slate-600 dark:text-slate-300">
                    <span className="font-semibold text-slate-800 dark:text-slate-100">
                      {n.actor?.name}
                    </span>{' '}
                    {t(`notifications.${n.type}`)}
                    {n.post && <span className="text-slate-400"> · {n.post.title}</span>}
                  </span>
                </Link>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
