import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MessageCircle, Heart, Clock } from 'lucide-react';
import { categoryBadgeClass } from '../utils/categoryStyles.js';

const excerpt = (text, length = 130) =>
  text.length > length ? `${text.slice(0, length).trim()}...` : text;

const initials = (name = '') =>
  name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const BlogCard = ({ post }) => {
  const { t } = useTranslation();
  return (
    <article className="group bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-soft transition-all duration-200">
      <Link to={`/posts/${post._id}`} className="block h-44 overflow-hidden bg-slate-100 dark:bg-slate-800/60">
        {post.image ? (
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-slate-300 dark:text-slate-700">
            {post.title.slice(0, 1).toUpperCase()}
          </div>
        )}
      </Link>

      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${categoryBadgeClass(post.category)}`}
          >
            {post.category}
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {new Date(post.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}
          </span>
          {post.readingTime && (
            <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
              <Clock size={11} /> {post.readingTime}m
            </span>
          )}
        </div>

        <h2 className="text-lg font-bold leading-snug mb-2 text-slate-900 dark:text-white">
          <Link to={`/posts/${post._id}`} className="hover:text-brand-600 dark:hover:text-brand-400">
            {post.title}
          </Link>
        </h2>

        <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">{excerpt(post.content)}</p>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-semibold flex items-center justify-center">
              {initials(post.author?.name) || '?'}
            </span>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
              {post.author?.name || t('common.unknownAuthor')}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
            <span className="flex items-center gap-1">
              <Heart size={13} className={post.isLiked ? 'fill-rose-500 text-rose-500' : ''} />
              {post.likeCount ?? (post.likes?.length || 0)}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle size={13} />
              {post.commentCount || 0}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
};

export default BlogCard;
