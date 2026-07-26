import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sparkles, Flame, Clock3, Wand2 } from 'lucide-react';
import BlogList from '../components/BlogList.jsx';
import SearchBar from '../components/SearchBar.jsx';
import Pagination from '../components/Pagination.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getPosts, getTrending, getFeed } from '../services/postService';

const TABS = [
  { key: 'forYou', icon: Wand2 },
  { key: 'trending', icon: Flame },
  { key: 'latest', icon: Clock3 },
];

const Home = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState(user ? 'forYou' : 'latest');
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [language, setLanguage] = useState(searchParams.get('language') || '');
  const [loading, setLoading] = useState(true);

  const isBrowsing = Boolean(search || category || language);

  useEffect(() => {
    setLoading(true);

    const params = { page, search, category, language, limit: 6 };

    let request;
    if (isBrowsing || tab === 'latest') {
      request = getPosts(params).then((data) => {
        setPosts(data.posts);
        setTotalPages(data.totalPages);
        setTotalPosts(data.totalPosts);
      });
    } else if (tab === 'trending') {
      request = getTrending({ language, limit: 12 }).then((data) => {
        setPosts(data.posts);
        setTotalPages(1);
        setTotalPosts(data.posts.length);
      });
    } else if (tab === 'forYou' && user) {
      request = getFeed({ limit: 12 }).then((data) => {
        setPosts(data.posts);
        setTotalPages(1);
        setTotalPosts(data.posts.length);
      });
    } else {
      setLoading(false);
      return;
    }

    request.finally(() => setLoading(false));

    const params2 = {};
    if (page > 1) params2.page = page;
    if (search) params2.search = search;
    if (category) params2.category = category;
    if (language) params2.language = language;
    setSearchParams(params2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, category, language, tab, user]);

  return (
    <div>
      <section className="relative overflow-hidden bg-hero-glow dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-14 text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-white dark:bg-slate-800/70 text-brand-700 dark:text-brand-300 border border-slate-200 dark:border-slate-700 mb-5">
            <Sparkles size={13} /> {t('home.badge')}
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
            {t('home.title1')} <span className="text-brand-600 dark:text-brand-400">{t('home.title2')}</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            {totalPosts > 0
              ? t('home.subtitleWithCount', { count: totalPosts })
              : t('home.subtitleEmpty')}
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <SearchBar
          onSearch={(term) => {
            setSearch(term);
            setPage(1);
          }}
          onCategoryChange={(cat) => {
            setCategory(cat);
            setPage(1);
          }}
          category={category}
          onLanguageChange={(lang) => {
            setLanguage(lang);
            setPage(1);
          }}
          language={language}
        />

        {!isBrowsing && (
          <div className="flex gap-1.5 mb-8 border-b border-slate-200 dark:border-slate-800">
            {TABS.map(({ key, icon: Icon }) => (
              <button
                key={key}
                onClick={() => {
                  setTab(key);
                  setPage(1);
                }}
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                  tab === key
                    ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <Icon size={15} />
                {t(`home.tab${key === 'forYou' ? 'ForYou' : key.charAt(0).toUpperCase() + key.slice(1)}`)}
              </button>
            ))}
          </div>
        )}

        {!isBrowsing && tab === 'forYou' && !user ? (
          <p className="text-center text-slate-400 dark:text-slate-500 py-16">
            {t('home.signInForYou')}
          </p>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-72 rounded-2xl bg-slate-100 dark:bg-slate-800/60 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <>
            <BlogList posts={posts} />
            {(isBrowsing || tab === 'latest') && (
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
