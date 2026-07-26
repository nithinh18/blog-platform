import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Trophy } from 'lucide-react';
import { getLeaderboard } from '../services/userService';

const initials = (name = '') =>
  name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const medalClass = (rank) => {
  if (rank === 0) return 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300';
  if (rank === 1) return 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200';
  if (rank === 2) return 'bg-orange-100 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300';
  return 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400';
};

const Leaderboard = () => {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard()
      .then((data) => setRows(data.leaderboard))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-white mb-1">
        <Trophy size={22} className="text-amber-500" /> {t('leaderboard.title')}
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
        {t('leaderboard.subtitle')}
      </p>

      {loading ? (
        <p className="text-slate-400 dark:text-slate-500">{t('common.loading')}</p>
      ) : rows.length === 0 ? (
        <p className="text-slate-400 dark:text-slate-500">{t('leaderboard.empty')}</p>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map((row, idx) => (
            <Link
              key={row.user._id}
              to={`/authors/${row.user._id}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/60"
            >
              <span
                className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-sm font-bold ${medalClass(idx)}`}
              >
                {idx + 1}
              </span>
              {row.user.avatar ? (
                <img src={row.user.avatar} alt={row.user.name} className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <span className="h-9 w-9 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold flex items-center justify-center">
                  {initials(row.user.name)}
                </span>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 dark:text-slate-100 truncate">{row.user.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('leaderboard.stats', {
                    posts: row.postCount,
                    likes: row.totalLikes,
                    comments: row.totalComments,
                  })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
