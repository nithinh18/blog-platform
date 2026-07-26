import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MessageCircle, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  getComments,
  addComment,
  updateComment,
  deleteComment,
  toggleCommentLike,
} from '../services/commentService';
import CommentCard from './CommentCard.jsx';

const mapTree = (nodes, id, fn) =>
  nodes.map((n) => {
    if (n._id === id) return fn(n);
    if (n.replies?.length) return { ...n, replies: mapTree(n.replies, id, fn) };
    return n;
  });

const removeFromTree = (nodes, id) =>
  nodes
    .filter((n) => n._id !== id)
    .map((n) => (n.replies?.length ? { ...n, replies: removeFromTree(n.replies, id) } : n));

const insertReply = (nodes, parentId, reply) =>
  nodes.map((n) => {
    if (n._id === parentId) return { ...n, replies: [...(n.replies || []), reply] };
    if (n.replies?.length) return { ...n, replies: insertReply(n.replies, parentId, reply) };
    return n;
  });

const countAll = (nodes) =>
  nodes.reduce((sum, n) => sum + 1 + (n.replies?.length ? countAll(n.replies) : 0), 0);

const CommentSection = ({ postId }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getComments(postId)
      .then((data) => setComments(data.comments))
      .finally(() => setLoading(false));
  }, [postId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      const data = await addComment(postId, text.trim());
      setComments((prev) => [data.comment, ...prev]);
      setText('');
    } catch (err) {
      setError(err.response?.data?.message || t('comment.addFailed'));
    }
  };

  const handleReply = async (parentId, replyText) => {
    const data = await addComment(postId, replyText, parentId);
    setComments((prev) => insertReply(prev, parentId, data.comment));
  };

  const handleUpdate = async (id, newText) => {
    const data = await updateComment(id, newText);
    setComments((prev) => mapTree(prev, id, (n) => ({ ...n, ...data.comment, replies: n.replies })));
  };

  const handleDelete = async (id) => {
    await deleteComment(id);
    setComments((prev) => removeFromTree(prev, id));
  };

  const handleToggleLike = async (id) => {
    const data = await toggleCommentLike(id);
    setComments((prev) =>
      mapTree(prev, id, (n) => ({ ...n, likeCount: data.likeCount, isLiked: data.isLiked }))
    );
  };

  return (
    <section className="mt-12">
      <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white mb-5">
        <MessageCircle size={19} className="text-brand-600 dark:text-brand-400" />
        {t('comment.title')}{' '}
        <span className="text-slate-400 dark:text-slate-500 font-medium">
          ({countAll(comments)})
        </span>
      </h2>

      {user ? (
        <form onSubmit={handleAdd} className="mb-8">
          {error && <p className="text-sm text-rose-600 dark:text-rose-400 mb-2">{error}</p>}
          <div className="flex gap-2 items-start bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-3">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={2}
              placeholder={t('comment.placeholder')}
              className="flex-1 resize-none bg-transparent text-sm focus:outline-none placeholder:text-slate-400"
            />
            <button
              type="submit"
              className="shrink-0 h-9 w-9 inline-flex items-center justify-center rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors"
              aria-label={t('comment.postAria')}
            >
              <Send size={15} />
            </button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
          <Link to="/login" className="text-brand-600 dark:text-brand-400 font-medium hover:underline">
            {t('nav.login')}
          </Link>{' '}
          {t('comment.loginToComment')}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-slate-400 dark:text-slate-500">{t('comment.loading')}</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500">{t('comment.noComments')}</p>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 px-5 divide-y divide-slate-100 dark:divide-slate-800">
          {comments.map((c) => (
            <CommentCard
              key={c._id}
              comment={c}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onReply={handleReply}
              onToggleLike={handleToggleLike}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default CommentSection;
