import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ShieldCheck, Users, FileText, MessageSquare, Trash2, Flag, Check, X } from 'lucide-react';
import {
  getAdminOverview,
  listAdminUsers,
  setUserRole,
  deleteAdminUser,
  listReports,
  resolveReport,
  dismissReport,
} from '../services/adminService';

const AdminPanel = () => {
  const { t } = useTranslation();
  const [tab, setTab] = useState('users');
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    Promise.all([getAdminOverview(), listAdminUsers(), listReports('open')]).then(
      ([ov, u, r]) => {
        setOverview(ov);
        setUsers(u.users);
        setReports(r.reports);
      }
    );
  };

  useEffect(() => {
    load();
    setLoading(false);
  }, []);

  const handleRoleToggle = async (u) => {
    const newRole = u.role === 'admin' ? 'user' : 'admin';
    await setUserRole(u._id, newRole);
    setUsers((prev) => prev.map((x) => (x._id === u._id ? { ...x, role: newRole } : x)));
  };

  const handleDelete = async (u) => {
    if (!window.confirm(t('admin.confirmDeleteUser', { name: u.name }))) return;
    await deleteAdminUser(u._id);
    setUsers((prev) => prev.filter((x) => x._id !== u._id));
  };

  const handleResolve = async (report, removeContent) => {
    if (removeContent && !window.confirm(t('admin.confirmRemoveContent'))) return;
    await resolveReport(report._id, removeContent);
    setReports((prev) => prev.filter((r) => r._id !== report._id));
  };

  const handleDismiss = async (report) => {
    await dismissReport(report._id);
    setReports((prev) => prev.filter((r) => r._id !== report._id));
  };

  if (loading || !overview) {
    return <p className="text-center py-24 text-slate-400 dark:text-slate-500">{t('common.loading')}</p>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <div className="flex items-center gap-2 mb-8">
        <ShieldCheck size={22} className="text-brand-600 dark:text-brand-400" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('admin.title')}</h1>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4">
          <span className="h-11 w-11 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
            <Users size={20} />
          </span>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{overview.stats.userCount}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('admin.totalUsers')}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4">
          <span className="h-11 w-11 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
            <FileText size={20} />
          </span>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{overview.stats.postCount}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('admin.totalPosts')}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4">
          <span className="h-11 w-11 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
            <MessageSquare size={20} />
          </span>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{overview.stats.commentCount}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('admin.totalComments')}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4">
          <span className="h-11 w-11 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-300 flex items-center justify-center">
            <Flag size={20} />
          </span>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{overview.stats.openReportCount}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('admin.openReports')}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-1.5 mb-5 border-b border-slate-200 dark:border-slate-800">
        {['users', 'reports'].map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors capitalize ${
              tab === key
                ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {key === 'reports' ? t('admin.reportsTab', { count: reports.length }) : t('admin.users')}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
          {users.map((u) => (
            <div key={u._id} className="flex items-center justify-between gap-4 px-5 py-3.5">
              <div>
                <p className="font-medium text-sm text-slate-800 dark:text-slate-100">{u.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    u.role === 'admin'
                      ? 'bg-brand-100 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {u.role}
                </span>
                <button
                  onClick={() => handleRoleToggle(u)}
                  className="text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  {u.role === 'admin' ? t('admin.makeUser') : t('admin.makeAdmin')}
                </button>
                <button
                  onClick={() => handleDelete(u)}
                  className="h-7 w-7 inline-flex items-center justify-center rounded-full text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                  aria-label={t('admin.deleteUser')}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'reports' && (
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
          {reports.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 px-5 py-8 text-center">
              {t('admin.noOpenReports')}
            </p>
          ) : (
            reports.map((r) => (
              <div key={r._id} className="px-5 py-4">
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <span className="text-xs font-semibold uppercase text-slate-400">
                    {t('admin.reportedBy', {
                      type: t(`admin.targetTypes.${r.targetType}`),
                      name: r.reporter?.name,
                    })}
                  </span>
                  <span className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-200 mb-1">
                  {r.targetType === 'post' ? (
                    <Link to={`/posts/${r.post?.slug || r.post?._id}`} className="hover:underline">
                      {r.post?.title || t('admin.postDeleted')}
                    </Link>
                  ) : (
                    <span>&ldquo;{r.comment?.comment || t('admin.commentDeleted')}&rdquo;</span>
                  )}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  {t('admin.reason', { reason: r.reason })}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleResolve(r, true)}
                    className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-300 hover:bg-rose-100"
                  >
                    <Trash2 size={12} /> {t('admin.removeContent')}
                  </button>
                  <button
                    onClick={() => handleResolve(r, false)}
                    className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-100"
                  >
                    <Check size={12} /> {t('admin.resolveNoAction')}
                  </button>
                  <button
                    onClick={() => handleDismiss(r)}
                    className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <X size={12} /> {t('admin.dismiss')}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
