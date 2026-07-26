// Mirrors the strict rules enforced server-side in
// server/validators/authValidators.js — kept in sync so the UI never shows
// a password/email/name as valid that the API would then reject.

// Accounts are Gmail-only: local part must start/end with an alphanumeric
// character (no leading/trailing/consecutive dots), domain must be gmail.com.
export const EMAIL_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]{0,63}[a-zA-Z0-9])?@gmail\.com$/;

export const isValidEmail = (email) => {
  const trimmed = email.trim().toLowerCase();
  return EMAIL_REGEX.test(trimmed) && !trimmed.includes('..');
};

export const NAME_REGEX = /^[\p{L}][\p{L}'.\- ]{1,59}$/u;

const PLACEHOLDER_NAMES = new Set([
  // Pronouns / self-reference — never a real person's name.
  'i', 'me', 'my', 'mine', 'myself', 'you', 'your', 'yours', 'yourself', 'he', 'him', 'his',
  'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'we', 'us', 'our', 'ours',
  'ourselves', 'they', 'them', 'their', 'theirs', 'themselves', 'someone', 'somebody', 'anyone',
  'everybody', 'everyone', 'nobody',

  // Generic account/identity/role words.
  'name', 'username', 'user', 'users', 'admin', 'administrator', 'moderator', 'mod', 'owner',
  'staff', 'support', 'team', 'guest', 'member', 'visitor', 'customer', 'client', 'root',
  'superuser', 'account', 'accounts', 'profile', 'profiles', 'personal', 'private',

  // Placeholder / test / lorem-ipsum style filler.
  'abc', 'abcd', 'abcde', 'abcdef', 'test', 'tester', 'testing', 'xyz', 'asdf', 'asdfgh',
  'qwerty', 'sample', 'demo', 'temp', 'temporary', 'fake', 'anonymous', 'anon', 'unknown',
  'noname', 'none', 'null', 'undefined', 'dummy', 'placeholder', 'firstname', 'lastname',
  'fullname', 'yourname', 'myname', 'na', 'nil', 'blank', 'random', 'example', 'foo', 'bar',
  'baz', 'lorem', 'ipsum', 'hello', 'welcome',

  // Media/content nouns — describe content, not a person.
  'media', 'video', 'videos', 'photo', 'photos', 'picture', 'pictures', 'image', 'images',
  'content', 'article', 'articles', 'blog', 'blogs', 'post', 'posts', 'story', 'stories',
  'news', 'update', 'updates', 'press',

  // Topic/category/interest words — belong on a tag, not a name field.
  'sports', 'cricket', 'football', 'soccer', 'basketball', 'tennis', 'hockey', 'baseball',
  'golf', 'movie', 'movies', 'music', 'song', 'songs', 'gaming', 'games', 'game', 'tech',
  'technology', 'fashion', 'travel', 'food', 'health', 'fitness', 'education', 'science',
  'art', 'business', 'finance', 'crypto', 'bitcoin', 'politics', 'weather', 'entertainment',
  'lifestyle', 'general',

  // Generic site/business nouns.
  'website', 'webpage', 'page', 'site', 'company', 'brand', 'product', 'products', 'service',
  'services', 'help', 'contact', 'info', 'information', 'official', 'group', 'community',
  'network', 'platform', 'app', 'application', 'settings', 'system', 'server', 'database',
  'other', 'others', 'misc', 'miscellaneous', 'generic', 'default', 'main', 'home',
]);

// A finite blocklist can never enumerate every generic/dictionary word
// someone might try ("cricket" today, something else tomorrow), so beyond
// the exact-match list above we also score each word structurally — real
// names have vowels spread through them and don't end in the suffixes
// English piles onto abstract nouns/gerunds. This only runs on plain a-z
// words, so it never touches non-Latin scripts (Devanagari, Tamil, etc.) —
// the site's own multi-language names are never subject to these checks.
const HAS_VOWEL = /[aeiou]/;
const LONG_CONSONANT_RUN = /[^aeiou]{5,}/; // e.g. "asdfgh" — no real word/name runs 5+ consonants
const GENERIC_SUFFIXES = [
  /ing$/, // trending, gaming, marketing
  /tion$/, /sion$/, // information, application, discussion
  /ment$/, // government, entertainment
  /ness$/, // business, happiness
  /ity$/, /ety$/, // celebrity, variety
  /ology$/, /graphy$/, // technology, photography
  /ball$/, // football, basketball, volleyball
  /ware$/, /tech$/, // software, hardware, fintech
];

const isLatinWord = (word) => /^[a-z]+$/.test(word);

// True if a word structurally reads as a generic/dictionary term rather
// than a name — independent of whether it's in PLACEHOLDER_NAMES.
const looksGeneric = (word) => {
  if (!isLatinWord(word) || word.length < 3) return false;
  if (!HAS_VOWEL.test(word)) return true;
  if (LONG_CONSONANT_RUN.test(word)) return true;
  if (word.length >= 6 && GENERIC_SUFFIXES.some((re) => re.test(word))) return true;
  return false;
};

export const isPlaceholderName = (rawName) => {
  const normalized = rawName.trim().toLowerCase().replace(/[.'-]/g, '');
  if (!normalized) return true;
  if (PLACEHOLDER_NAMES.has(normalized)) return true;

  const words = normalized.split(/\s+/).filter(Boolean);
  if (!words.length) return true;

  const isSuspicious = (w) => PLACEHOLDER_NAMES.has(w) || looksGeneric(w);
  if (words.length === 1 ? isSuspicious(words[0]) : words.every(isSuspicious)) return true;

  const lettersOnly = normalized.replace(/\s/g, '');
  if (lettersOnly.length >= 3 && /^(.)\1+$/.test(lettersOnly)) return true;

  return false;
};

export const isValidName = (name) => {
  const trimmed = name.trim();
  return trimmed.length >= 2 && NAME_REGEX.test(trimmed) && !isPlaceholderName(trimmed);
};

export const PASSWORD_RULES = [
  { key: 'length', test: (v) => v.length >= 8 && v.length <= 128 },
  { key: 'lower', test: (v) => /[a-z]/.test(v) },
  { key: 'upper', test: (v) => /[A-Z]/.test(v) },
  { key: 'number', test: (v) => /[0-9]/.test(v) },
  { key: 'special', test: (v) => /[^A-Za-z0-9]/.test(v) },
  { key: 'noSpace', test: (v) => v.length === 0 || /^\S+$/.test(v) },
];

export const getPasswordChecklist = (password) =>
  PASSWORD_RULES.map((rule) => ({ ...rule, passed: rule.test(password) }));

export const isPasswordStrict = (password) => PASSWORD_RULES.every((rule) => rule.test(password));
