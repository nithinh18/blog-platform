import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link2, Check } from 'lucide-react';

// Simple monochrome brand glyphs so we don't pull in a whole icon set for
// three logos, and stay consistent with the site's flat icon style.
const WhatsAppIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.39 1.26 4.81L2 22l5.41-1.42a9.9 9.9 0 0 0 4.63 1.18h.01c5.46 0 9.9-4.45 9.9-9.91C21.95 6.45 17.5 2 12.04 2Zm5.8 14.03c-.25.7-1.24 1.28-2.02 1.44-.54.11-1.24.2-3.6-.77-3.02-1.25-4.96-4.32-5.11-4.52-.15-.2-1.22-1.62-1.22-3.1 0-1.47.77-2.19 1.04-2.49.27-.3.59-.37.79-.37h.57c.18 0 .43-.07.67.51.25.6.85 2.08.92 2.23.07.15.12.33.02.53-.1.2-.15.33-.3.5-.15.18-.31.4-.44.53-.15.15-.31.31-.13.6.18.3.8 1.32 1.72 2.14 1.19 1.06 2.19 1.39 2.49 1.55.3.15.47.13.65-.08.18-.2.75-.87.95-1.17.2-.3.4-.25.67-.15.28.1 1.76.83 2.06.98.3.15.5.23.57.35.08.13.08.72-.17 1.42Z" />
  </svg>
);

const XIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M13.6 10.6 20.4 3h-1.6l-5.9 6.6L8.2 3H2.9l7.1 9.9L2.9 21h1.6l6.2-7 5 7h5.3l-7.4-10.4Zm-2.2 2.5-.7-1L4.9 4.2h2.5l4.6 6.5.7 1 6 8.4h-2.5l-4.9-6.6Z" />
  </svg>
);

const FacebookIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M13.5 21v-7.6h2.6l.4-3h-3v-1.9c0-.87.24-1.46 1.5-1.46h1.6V4.4c-.28-.04-1.24-.12-2.35-.12-2.33 0-3.93 1.42-3.93 4.03v2.25H7.7v3h2.62V21h3.18Z" />
  </svg>
);

const ShareButtons = ({ url, title }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API can fail on non-secure origins; silently no-op
    }
  };

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const links = [
    { key: 'whatsapp', Icon: WhatsAppIcon, href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}` },
    { key: 'x', Icon: XIcon, href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}` },
    { key: 'facebook', Icon: FacebookIcon, href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
  ];

  return (
    <div className="flex items-center gap-1.5">
      {links.map(({ key, Icon, href }) => (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="h-8 w-8 inline-flex items-center justify-center rounded-full text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label={t('share.shareOn', { platform: key })}
        >
          <Icon className="h-4 w-4" />
        </a>
      ))}
      <button
        onClick={handleCopy}
        className="h-8 w-8 inline-flex items-center justify-center rounded-full text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        aria-label={t('share.copyLink')}
      >
        {copied ? <Check size={15} /> : <Link2 size={15} />}
      </button>
    </div>
  );
};

export default ShareButtons;
