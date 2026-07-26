import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, History } from 'lucide-react';
import { getRevisions } from '../services/postService';

const RevisionHistoryModal = ({ postId, onClose }) => {
  const { t } = useTranslation();
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRevisions(postId)
      .then((data) => setRevisions(data.revisions))
      .finally(() => setLoading(false));
  }, [postId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[80vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
            <History size={16} /> {t('revisions.title')}
          </h2>
          <button
            onClick={onClose}
            className="h-7 w-7 inline-flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-slate-400">{t('common.loading')}</p>
        ) : revisions.length === 0 ? (
          <p className="text-sm text-slate-400">{t('revisions.empty')}</p>
        ) : (
          <div className="space-y-4">
            {revisions.map((rev) => (
              <div key={rev._id} className="border border-slate-200 dark:border-slate-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {rev.title}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(rev.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3">
                  {rev.content.slice(0, 200)}
                  {rev.content.length > 200 ? '...' : ''}
                </p>
                <p className="text-[11px] text-slate-400 mt-2">
                  {t('revisions.editedBy', { name: rev.editedBy?.name || t('revisions.unknown') })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RevisionHistoryModal;
