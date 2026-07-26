import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Hash } from 'lucide-react';
import BlogList from '../components/BlogList.jsx';
import Pagination from '../components/Pagination.jsx';
import { getTags, getPosts } from '../services/postService';

const AllTags = () => {
  const { t } = useTranslation();
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTags()
      .then((data) => setTags(data.tags))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{t('tags.title')}</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
        {t('tags.subtitle')}
      </p>

      {loading ? (
        <p className="text-slate-400 dark:text-slate-500">{t('common.loading')}</p>
      ) : tags.length === 0 ? (
        <p className="text-slate-400 dark:text-slate-500">{t('tags.empty')}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Link
              key={tag}
              to={`/tags/${encodeURIComponent(tag)}`}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
            >
              <Hash size={13} />
              {tag}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

const TagPosts = () => {
  const { t } = useTranslation();
  const { tag } = useParams();
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getPosts({ tag, page, limit: 9 })
      .then((data) => {
        setPosts(data.posts);
        setTotalPages(data.totalPages);
      })
      .finally(() => setLoading(false));
  }, [tag, page]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <Link to="/tags" className="text-sm text-brand-600 dark:text-brand-400 hover:underline">
        &larr; {t('tags.allTags')}
      </Link>
      <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-white mt-2 mb-8">
        <Hash size={20} className="text-slate-400" />
        {tag}
      </h1>

      {loading ? (
        <p className="text-slate-400 dark:text-slate-500">{t('common.loading')}</p>
      ) : (
        <>
          <BlogList posts={posts} />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
};

export { AllTags, TagPosts };
