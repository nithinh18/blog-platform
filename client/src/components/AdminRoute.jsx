import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.jsx';

const AdminRoute = ({ children }) => {
  const { t } = useTranslation();
  const { user, loading } = useAuth();

  if (loading) {
    return <p className="text-center py-20 text-slate-400 dark:text-slate-500">{t('common.loading')}</p>;
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
