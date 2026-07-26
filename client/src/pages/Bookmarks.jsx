import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bookmark } from 'lucide-react';
import { getBookmarks } from '../services/postService';
import BlogList from '../components/BlogList.jsx';

const Bookmarks = () => {
  const { t } = useTranslation();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBookmarks()
      .then((data) => setPosts(data.posts))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <div className="flex items-center gap-2 mb-8">
        <Bookmark size={22} className="text-brand-600 dark:text-brand-400" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {t('nav.bookmarks')}
        </h1>
      </div>

      {loading ? (
        <p className="text-center text-slate-400 dark:text-slate-500 py-16">{t('common.loading')}</p>
      ) : (
        <BlogList posts={posts} />
      )}
    </div>
  );
};

export default Bookmarks;
