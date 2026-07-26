import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PostForm from '../components/PostForm.jsx';
import { createPost } from '../services/postService';

const CreatePost = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSubmit = async (formData) => {
    const data = await createPost(formData);
    navigate(`/posts/${data.post._id}`);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('createPost.title')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {t('createPost.subtitle')}
        </p>
      </div>
      <PostForm onSubmit={handleSubmit} />
    </div>
  );
};

export default CreatePost;
