import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import { Pencil, Trash2, Heart, Bookmark, Clock, Eye, Flag, History } from 'lucide-react';
import { getPost, deletePost, toggleLike, toggleBookmark } from '../services/postService';
import { reportPost } from '../services/reportService';
import { useAuth } from '../context/AuthContext.jsx';
import CommentSection from '../components/CommentSection.jsx';
import BlogCard from '../components/BlogCard.jsx';
import ReadingProgressBar from '../components/ReadingProgressBar.jsx';
import ShareButtons from '../components/ShareButtons.jsx';
import FontSizeControl from '../components/FontSizeControl.jsx';
import TextToSpeechButton from '../components/TextToSpeechButton.jsx';
import PollWidget from '../components/PollWidget.jsx';
import ReportModal from '../components/ReportModal.jsx';
import RevisionHistoryModal from '../components/RevisionHistoryModal.jsx';
import { categoryBadgeClass } from '../utils/categoryStyles.js';

const initials = (name = '') =>
  name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const SinglePost = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const resumedRef = useRef(false);

  useEffect(() => {
    setLoading(true);
    resumedRef.current = false;
    getPost(id)
      .then((data) => {
        setPost(data.post);
        setRelated(data.related || []);
        setIsBookmarked((user?.bookmarks || []).some((b) => String(b) === String(data.post._id)));
      })
      .catch(() => setError(t('post.notFound')))
      .finally(() => setLoading(false));
  }, [id, user]);

  // "Continue reading" — remember scroll position per post and offer to
  // resume there, so a half-read long post isn't lost on the next visit.
  useEffect(() => {
    if (!post || resumedRef.current) return;
    resumedRef.current = true;
    const saved = Number(localStorage.getItem(`readpos:${post._id}`));
    if (saved > 200) {
      requestAnimationFrame(() => window.scrollTo({ top: saved, behavior: 'smooth' }));
    }
  }, [post]);

  useEffect(() => {
    if (!post) return undefined;
    let handle;
    const onScroll = () => {
      clearTimeout(handle);
      handle = setTimeout(() => {
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        if (scrollable > 0 && window.scrollY / scrollable > 0.95) {
          localStorage.removeItem(`readpos:${post._id}`);
        } else {
          localStorage.setItem(`readpos:${post._id}`, String(window.scrollY));
        }
      }, 400);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      clearTimeout(handle);
    };
  }, [post]);

  const handleDelete = async () => {
    if (!window.confirm(t('post.confirmDelete'))) return;
    await deletePost(id);
    navigate('/dashboard');
  };

  const handleLike = async () => {
    const data = await toggleLike(post._id);
    setPost((prev) => ({ ...prev, likeCount: data.likeCount, isLiked: data.isLiked }));
  };

  const handleBookmark = async () => {
    const data = await toggleBookmark(post._id);
    setIsBookmarked(data.isBookmarked);
  };

  if (loading) {
    return <p className="text-center py-24 text-slate-400 dark:text-slate-500">{t('common.loading')}</p>;
  }
  if (error || !post) {
    return (
      <p className="text-center py-24 text-rose-600 dark:text-rose-400">
        {error || t('post.notFound')}
      </p>
    );
  }

  const isOwner = user && post.author?._id === user._id;
  const pageUrl = `${window.location.origin}/posts/${post.slug || post._id}`;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <ReadingProgressBar />

      {post.image && (
        <img
          src={post.image}
          alt={post.imageAlt || post.title}
          className="w-full h-72 object-cover rounded-lg mb-8 border border-slate-200 dark:border-slate-800"
        />
      )}

      <div className="flex items-center gap-2 mb-3">
        <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${categoryBadgeClass(post.category)}`}>
          {post.category}
        </span>
        {post.tags?.map((tag) => (
          <Link
            key={tag}
            to={`/tags/${encodeURIComponent(tag)}`}
            className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400"
          >
            #{tag}
          </Link>
        ))}
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
        {post.title}
      </h1>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500 dark:text-slate-400 mb-8 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-2.5">
          <Link to={`/authors/${post.author?._id}`}>
            <span className="h-9 w-9 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold flex items-center justify-center">
              {initials(post.author?.name) || '?'}
            </span>
          </Link>
          <div>
            <Link
              to={`/authors/${post.author?._id}`}
              className="font-medium text-slate-700 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-400"
            >
              {post.author?.name}
            </Link>
            <p className="text-xs flex items-center gap-2">
              {new Date(post.createdAt).toLocaleDateString()}
              <span className="flex items-center gap-1">
                <Clock size={11} /> {t('post.readingTime', { count: post.readingTime })}
              </span>
              <span className="flex items-center gap-1">
                <Eye size={11} /> {post.views}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <FontSizeControl />
          <TextToSpeechButton text={`${post.title}. ${post.content}`} />
          <ShareButtons url={pageUrl} title={post.title} />
          {!isOwner && (
            <button
              onClick={() => setShowReport(true)}
              className="h-8 w-8 inline-flex items-center justify-center rounded-full text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label={t('post.reportPost')}
              title={t('post.reportPost')}
            >
              <Flag size={14} />
            </button>
          )}
          {isOwner && (
            <>
              <button
                onClick={() => setShowHistory(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-400"
              >
                <History size={13} /> History
              </button>
              <Link
                to={`/edit-post/${post._id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-400"
              >
                <Pencil size={13} /> {t('post.edit')}
              </Link>
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-slate-200 dark:border-slate-700 text-rose-600 dark:text-rose-400 hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10"
              >
                <Trash2 size={13} /> {t('post.delete')}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="prose prose-slate dark:prose-invert max-w-none leading-relaxed">
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </div>

      {post.poll && (
        <PollWidget
          postId={post._id}
          poll={post.poll}
          myVote={post.poll.myVote}
          onVoted={(poll) => setPost((prev) => ({ ...prev, poll }))}
        />
      )}

      {user && (
        <div className="flex items-center gap-3 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={handleLike}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              post.isLiked
                ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-rose-300'
            }`}
          >
            <Heart size={15} className={post.isLiked ? 'fill-rose-500' : ''} />
            {post.likeCount} {t('post.like')}
          </button>
          <button
            onClick={handleBookmark}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              isBookmarked
                ? 'bg-brand-50 dark:bg-brand-500/10 border-brand-200 dark:border-brand-500/30 text-brand-600 dark:text-brand-400'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-brand-300'
            }`}
          >
            <Bookmark size={15} className={isBookmarked ? 'fill-brand-500' : ''} />
            {t('post.bookmark')}
          </button>
        </div>
      )}

      <CommentSection postId={post._id} />

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-5">
            {t('post.related')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {related.map((p) => (
              <BlogCard key={p._id} post={p} />
            ))}
          </div>
        </section>
      )}

      {showReport && (
        <ReportModal onClose={() => setShowReport(false)} onSubmit={(reason) => reportPost(post._id, reason)} />
      )}
      {showHistory && <RevisionHistoryModal postId={post._id} onClose={() => setShowHistory(false)} />}
    </div>
  );
};

export default SinglePost;
