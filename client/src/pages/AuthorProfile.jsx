import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UserPlus, UserMinus, Award } from 'lucide-react';
import { getPublicProfile, toggleFollow } from '../services/userService';
import { useAuth } from '../context/AuthContext.jsx';
import BlogList from '../components/BlogList.jsx';

const initials = (name = '') =>
  name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const AuthorProfile = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublicProfile(id)
      .then((data) => {
        setProfile(data.user);
        setPosts(data.posts);
        setIsFollowing(data.isFollowing);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleFollow = async () => {
    const data = await toggleFollow(id);
    setIsFollowing(data.isFollowing);
    setProfile((prev) => ({
      ...prev,
      followerCount: prev.followerCount + (data.isFollowing ? 1 : -1),
    }));
  };

  if (loading) return <p className="text-center py-24 text-slate-400 dark:text-slate-500">{t('common.loading')}</p>;
  if (!profile) return <p className="text-center py-24 text-rose-600 dark:text-rose-400">{t('profile.userNotFound')}</p>;

  const isSelf = user && user._id === profile._id;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 mb-10 text-center sm:text-left">
        {profile.avatar ? (
          <img
            src={profile.avatar}
            alt={profile.name}
            className="h-20 w-20 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="h-20 w-20 shrink-0 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-2xl font-semibold flex items-center justify-center">
            {initials(profile.name) || 'U'}
          </span>
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{profile.name}</h1>
          {profile.bio && <p className="text-slate-500 dark:text-slate-400 mt-1">{profile.bio}</p>}
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
            {profile.followerCount} {t('profile.followers')} &bull;{' '}
            {t('profile.joined', { date: new Date(profile.createdAt).toLocaleDateString() })}
          </p>
          {profile.badges?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {profile.badges.map((b) => (
                <span
                  key={b.key}
                  className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300"
                >
                  <Award size={11} /> {t(`profile.badges.${b.key}`)}
                </span>
              ))}
            </div>
          )}
        </div>
        {!isSelf && user && (
          <button
            onClick={handleFollow}
            className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
              isFollowing
                ? 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-rose-300 hover:text-rose-600'
                : 'bg-brand-600 text-white hover:bg-brand-700'
            }`}
          >
            {isFollowing ? <UserMinus size={15} /> : <UserPlus size={15} />}
            {isFollowing ? t('profile.unfollow') : t('profile.follow')}
          </button>
        )}
      </div>

      <BlogList posts={posts} />
    </div>
  );
};

export default AuthorProfile;
