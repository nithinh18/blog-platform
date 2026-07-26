import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Volume2, Square } from 'lucide-react';

const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

// Script (Unicode range) -> BCP-47 tag, so posts are read in whichever of the
// site's supported languages they're actually written in, not the UI language.
const SCRIPT_LANGS = [
  { lang: 'hi-IN', pattern: /[ऀ-ॿ]/ }, // Devanagari
  { lang: 'gu-IN', pattern: /[઀-૿]/ }, // Gujarati
  { lang: 'ta-IN', pattern: /[஀-௿]/ }, // Tamil
  { lang: 'te-IN', pattern: /[ఀ-౿]/ }, // Telugu
  { lang: 'kn-IN', pattern: /[ಀ-೿]/ }, // Kannada
  { lang: 'ml-IN', pattern: /[ഀ-ൿ]/ }, // Malayalam
];

const detectLang = (text) => {
  const match = SCRIPT_LANGS.find(({ pattern }) => pattern.test(text));
  return match ? match.lang : 'en-US';
};

const pickVoice = (voices, lang) => {
  if (!voices.length) return null;
  const prefix = lang.split('-')[0];
  return (
    voices.find((v) => v.lang === lang) ||
    voices.find((v) => v.lang?.toLowerCase().startsWith(prefix)) ||
    null
  );
};

const TextToSpeechButton = ({ text }) => {
  const { t } = useTranslation();
  const [speaking, setSpeaking] = useState(false);
  const voicesRef = useRef([]);

  useEffect(() => {
    if (!supported) return undefined;
    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      window.speechSynthesis.cancel();
    };
  }, []);

  if (!supported) return null;

  const toggle = () => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    const lang = detectLang(text);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    const voice = pickVoice(voicesRef.current, lang);
    if (voice) utterance.voice = voice;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  return (
    <button
      onClick={toggle}
      className="h-8 w-8 inline-flex items-center justify-center rounded-full text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      aria-label={speaking ? t('post.stopReading') : t('post.readAloud')}
      title={speaking ? t('post.stopReading') : t('post.readAloud')}
    >
      {speaking ? <Square size={14} /> : <Volume2 size={15} />}
    </button>
  );
};

export default TextToSpeechButton;
