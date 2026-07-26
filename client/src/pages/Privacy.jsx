import { useTranslation } from 'react-i18next';

const Section = ({ title, children }) => (
  <section className="mb-8">
    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{title}</h2>
    <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-2">
      {children}
    </div>
  </section>
);

const Privacy = () => {
  const { t } = useTranslation();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{t('privacy.title')}</h1>
      <p className="text-sm text-slate-400 dark:text-slate-500 mb-8">{t('privacy.lastUpdated')}</p>

      <Section title={t('privacy.storeTitle')}>
        <p>{t('privacy.storeBody')}</p>
      </Section>

      <Section title={t('privacy.cookiesTitle')}>
        <p>{t('privacy.cookiesBody')}</p>
      </Section>

      <Section title={t('privacy.visibilityTitle')}>
        <p>{t('privacy.visibilityBody')}</p>
      </Section>

      <Section title={t('privacy.controlsTitle')}>
        <p>{t('privacy.controlsBody')}</p>
      </Section>

      <Section title={t('privacy.thirdPartyTitle')}>
        <p>{t('privacy.thirdPartyBody')}</p>
      </Section>
    </div>
  );
};

export default Privacy;
