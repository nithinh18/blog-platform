import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera } from 'lucide-react';
import { uploadAvatar } from '../services/authService';

const initials = (name = '') =>
  name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const AvatarUpload = ({ user, onUpdated }) => {
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError('');
    try {
      const data = await uploadAvatar(file);
      onUpdated(data.user);
    } catch (err) {
      setError(err.response?.data?.message || t('avatarUpload.uploadFailed'));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="relative group h-16 w-16 rounded-full overflow-hidden"
        title={t('avatarUpload.changeAvatar')}
      >
        {user?.avatar ? (
          <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
        ) : (
          <span className="h-full w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xl font-semibold flex items-center justify-center">
            {initials(user?.name) || 'U'}
          </span>
        )}
        <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
          <Camera size={18} className="text-white" />
        </span>
      </button>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      {uploading && <p className="text-xs text-slate-400 mt-2">{t('avatarUpload.uploading')}</p>}
      {error && <p className="text-xs text-rose-500 mt-2">{error}</p>}
    </div>
  );
};

export default AvatarUpload;
