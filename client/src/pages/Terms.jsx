import { useTranslation } from 'react-i18next';

const Section = ({ title, children }) => (
  <section className="mb-8">
    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{title}</h2>
    <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-2">
      {children}
    </div>
  </section>
);

const Terms = () => {
  const { t } = useTranslation();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{t('terms.title')}</h1>
      <p className="text-sm text-slate-400 dark:text-slate-500 mb-8">{t('terms.lastUpdated')}</p>

      <Section title={t('terms.accountTitle')}>
        <p>{t('terms.accountBody')}</p>
      </Section>

      <Section title={t('terms.contentTitle')}>
        <p>{t('terms.contentBody1')}</p>
        <p>{t('terms.contentBody2')}</p>
      </Section>

      <Section title={t('terms.accessTitle')}>
        <p>{t('terms.accessBody')}</p>
      </Section>

      <Section title={t('terms.terminationTitle')}>
        <p>{t('terms.terminationBody')}</p>
      </Section>

      <Section title={t('terms.warrantyTitle')}>
        <p>{t('terms.warrantyBody')}</p>
      </Section>
    </div>
  );
};

export default Terms;
