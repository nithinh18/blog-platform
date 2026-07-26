import { useTranslation } from 'react-i18next';
import { Check, X } from 'lucide-react';
import { getPasswordChecklist } from '../utils/validation.js';

const PasswordChecklist = ({ password }) => {
  const { t } = useTranslation();
  const checklist = getPasswordChecklist(password);

  return (
    <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1">
      {checklist.map(({ key, passed }) => (
        <li
          key={key}
          className={`flex items-center gap-1.5 text-xs ${
            passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          {passed ? <Check size={12} /> : <X size={12} />}
          {t(`auth.passwordRules.${key}`)}
        </li>
      ))}
    </ul>
  );
};

export default PasswordChecklist;
