import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, FileText, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { getPosts, deletePost } from '../services/postService';
import { categoryBadgeClass } from '../utils/categoryStyles.js';

const Dashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [tab, setTab] = useState('published');
  const [loading, setLoading] = useState(true);

  const loadPosts = () => {
    setLoading(true);
    getPosts({ author: user._id, limit: 100 })
      .then((data) => setPosts(data.posts))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleDelete = async (id) => {
    if (!window.confirm(t('dashboard.confirmDeletePost'))) return;
    await deletePost(id);
    setPosts((prev) => prev.filter((p) => p._id !== id));
  };

  const published = posts.filter((p) => p.status === 'published');
  const drafts = posts.filter((p) => p.status === 'draft');
  const visible = tab === 'published' ? published : drafts;
  const totalComments = published.reduce((sum, p) => sum + (p.commentCount || 0), 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t('dashboard.title')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('dashboard.subtitle')}</p>
        </div>
        <Link
          to="/create-post"
          className="inline-flex items-center gap-1.5 bg-brand-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors"
        >
          <Plus size={16} /> {t('dashboard.newPost')}
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4">
          <span className="h-11 w-11 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
            <FileText size={20} />
          </span>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{published.length}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('dashboard.postsPublished')}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4">
          <span className="h-11 w-11 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
            <MessageSquare size={20} />
          </span>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalComments}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('dashboard.totalComments')}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-1.5 mb-5 border-b border-slate-200 dark:border-slate-800">
        {['published', 'drafts'].map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              tab === key
                ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {t(`dashboard.tab${key.charAt(0).toUpperCase() + key.slice(1)}`)} (
            {key === 'published' ? published.length : drafts.length})
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-slate-400 dark:text-slate-500 py-16">{t('common.loading')}</p>
      ) : visible.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
          <p className="text-slate-500 dark:text-slate-400 mb-4">{t('dashboard.noPosts')}</p>
          <Link
            to="/create-post"
            className="inline-flex items-center gap-1.5 text-brand-600 dark:text-brand-400 font-semibold text-sm hover:underline"
          >
            <Plus size={15} /> {t('dashboard.writeFirst')}
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
          {visible.map((post) => (
            <div key={post._id} className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${categoryBadgeClass(post.category)}`}>
                    {post.category}
                  </span>
                  {post.status === 'draft' && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300">
                      {t('post.draft')}
                    </span>
                  )}
                </div>
                <Link
                  to={`/posts/${post._id}`}
                  className="font-semibold text-slate-800 dark:text-slate-100 hover:text-brand-600 dark:hover:text-brand-400 truncate block"
                >
                  {post.title}
                </Link>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {new Date(post.createdAt).toLocaleDateString()} &bull;{' '}
                  {t('dashboard.commentsCount', { count: post.commentCount || 0 })}
                </p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button
                  onClick={() => navigate(`/edit-post/${post._id}`)}
                  className="h-8 w-8 inline-flex items-center justify-center rounded-full text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/10"
                  aria-label={t('dashboard.editPostAria')}
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => handleDelete(post._id)}
                  className="h-8 w-8 inline-flex items-center justify-center rounded-full text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                  aria-label={t('dashboard.deletePostAria')}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
