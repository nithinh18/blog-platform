import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Trash2, Heart, MessageSquare, Flag } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { reportComment } from '../services/reportService';
import ReportModal from './ReportModal.jsx';

const initials = (name = '') =>
  name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const CommentCard = ({ comment, depth = 0, onUpdate, onDelete, onReply, onToggleLike }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [replying, setReplying] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [text, setText] = useState(comment.comment);
  const [replyText, setReplyText] = useState('');
  const isOwner = user && comment.user?._id === user._id;

  const handleSave = async () => {
    if (!text.trim()) return;
    await onUpdate(comment._id, text.trim());
    setEditing(false);
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    await onReply(comment._id, replyText.trim());
    setReplyText('');
    setReplying(false);
  };

  return (
    <div className={depth > 0 ? 'pl-4 sm:pl-8 border-l-2 border-slate-100 dark:border-slate-800' : ''}>
      <div className="flex gap-3 py-4">
        <span className="h-8 w-8 shrink-0 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-semibold flex items-center justify-center">
          {initials(comment.user?.name) || '?'}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">
              {comment.user?.name || t('comment.deletedUser')}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {new Date(comment.createdAt).toLocaleString()}
            </span>
          </div>

          {editing ? (
            <div className="space-y-2 mt-1.5">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="text-xs font-semibold bg-brand-600 text-white px-3 py-1.5 rounded-full hover:bg-brand-700"
                >
                  {t('comment.save')}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setText(comment.comment);
                  }}
                  className="text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  {t('comment.cancel')}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-300">{comment.comment}</p>
          )}

          {!editing && (
            <div className="flex items-center gap-4 mt-1.5">
              <button
                onClick={() => onToggleLike(comment._id)}
                className={`inline-flex items-center gap-1 text-xs hover:text-rose-500 ${
                  comment.isLiked ? 'text-rose-500' : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                <Heart size={12} className={comment.isLiked ? 'fill-rose-500' : ''} />
                {comment.likeCount || 0}
              </button>

              {user && depth < 3 && (
                <button
                  onClick={() => setReplying((r) => !r)}
                  className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 hover:text-brand-600 dark:hover:text-brand-400"
                >
                  <MessageSquare size={12} /> {t('comment.reply')}
                </button>
              )}

              {isOwner ? (
                <>
                  <button
                    onClick={() => setEditing(true)}
                    className="inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    <Pencil size={12} /> {t('post.edit')}
                  </button>
                  <button
                    onClick={() => onDelete(comment._id)}
                    className="inline-flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 hover:underline"
                  >
                    <Trash2 size={12} /> {t('post.delete')}
                  </button>
                </>
              ) : (
                user && (
                  <button
                    onClick={() => setShowReport(true)}
                    className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 hover:text-rose-500"
                  >
                    <Flag size={12} /> {t('comment.report')}
                  </button>
                )
              )}
            </div>
          )}

          {showReport && (
            <ReportModal
              onClose={() => setShowReport(false)}
              onSubmit={(reason) => reportComment(comment._id, reason)}
            />
          )}

          {replying && (
            <form onSubmit={handleReply} className="mt-2 flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={t('comment.placeholder')}
                className="flex-1 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="submit"
                className="text-xs font-semibold bg-brand-600 text-white px-3.5 py-1.5 rounded-full hover:bg-brand-700"
              >
                {t('comment.reply')}
              </button>
            </form>
          )}
        </div>
      </div>

      {comment.replies?.length > 0 && (
        <div>
          {comment.replies.map((reply) => (
            <CommentCard
              key={reply._id}
              comment={reply}
              depth={depth + 1}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onReply={onReply}
              onToggleLike={onToggleLike}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentCard;
