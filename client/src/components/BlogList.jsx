import { useTranslation } from 'react-i18next';
import { FileQuestion } from 'lucide-react';
import BlogCard from './BlogCard.jsx';

const BlogList = ({ posts }) => {
  const { t } = useTranslation();

  if (!posts || posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-400 dark:text-slate-600">
        <FileQuestion size={32} />
        <p className="text-sm">{t('search.noResults')}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
      {posts.map((post) => (
        <BlogCard key={post._id} post={post} />
      ))}
    </div>
  );
};

export default BlogList;
