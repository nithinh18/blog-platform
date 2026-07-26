import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PostForm from '../components/PostForm.jsx';
import { getPost, updatePost } from '../services/postService';
import { useAuth } from '../context/AuthContext.jsx';

const EditPost = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getPost(id)
      .then((data) => {
        if (user && data.post.author._id !== user._id && user.role !== 'admin') {
          setError(t('editPost.notAuthorized'));
          return;
        }
        setPost(data.post);
      })
      .catch(() => setError(t('editPost.notFound')))
      .finally(() => setLoading(false));
  }, [id, user, t]);

  const handleSubmit = async (formData) => {
    const data = await updatePost(id, formData);
    navigate(`/posts/${data.post._id}`);
  };

  if (loading) {
    return <p className="text-center py-24 text-slate-400 dark:text-slate-500">{t('common.loading')}</p>;
  }
  if (error) {
    return <p className="text-center py-24 text-rose-600 dark:text-rose-400">{error}</p>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('editPost.title')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('editPost.subtitle')}</p>
      </div>
      <PostForm initialValues={post} onSubmit={handleSubmit} />
    </div>
  );
};

export default EditPost;
