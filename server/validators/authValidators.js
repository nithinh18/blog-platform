const { z } = require('zod');
const { CATEGORIES, LANGUAGE_CODES } = require('../config/constants');

// Accounts are restricted to real Gmail addresses only — no other providers,
// and no obviously-fake domains. Local part must start/end with an
// alphanumeric character (no leading/trailing/consecutive dots) and the
// domain must be exactly gmail.com.
const GMAIL_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]{0,63}[a-zA-Z0-9])?@gmail\.com$/;

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Email is required')
  .max(254, 'Email is too long')
  .regex(GMAIL_REGEX, 'Please provide a valid Gmail address (e.g. name@gmail.com)')
  .refine((email) => !/\.\./.test(email), {
    message: 'Please provide a valid Gmail address (e.g. name@gmail.com)',
  });

// Rejects placeholder/junk names so real identities are required — see
// isPlaceholderName() below for what counts as junk.
const NAME_REGEX = /^[\p{L}][\p{L}'.\- ]{1,59}$/u;

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

const isPlaceholderName = (rawName) => {
  const normalized = rawName.trim().toLowerCase().replace(/[.'-]/g, '');
  if (!normalized) return true;
  if (PLACEHOLDER_NAMES.has(normalized)) return true;

  const words = normalized.split(/\s+/).filter(Boolean);
  if (!words.length) return true;

  const isSuspicious = (w) => PLACEHOLDER_NAMES.has(w) || looksGeneric(w);
  if (words.length === 1 ? isSuspicious(words[0]) : words.every(isSuspicious)) return true;

  // A single character repeated throughout, e.g. "aaaa" or "xxxxxxx".
  const lettersOnly = normalized.replace(/\s/g, '');
  if (lettersOnly.length >= 3 && /^(.)\1+$/.test(lettersOnly)) return true;

  return false;
};

const nameSchema = z
  .string()
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(60)
  .regex(NAME_REGEX, 'Name can only contain letters, spaces, hyphens, and apostrophes')
  .refine((n) => !isPlaceholderName(n), { message: 'Please enter your real name' });

// Strict password policy, enforced whenever a password is being created/set
// (register, reset-password) — not on login, where we just check the hash.
const strictPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
  .regex(/^\S+$/, 'Password must not contain spaces');

const registerSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: strictPasswordSchema,
  })
  .refine((data) => !data.password.toLowerCase().includes(data.email.split('@')[0].toLowerCase()), {
    message: 'Password must not contain your email address',
    path: ['password'],
  });

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

const otpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'Enter the 6-digit code');

const forgotPasswordSchema = z.object({
  email: emailSchema,
});

const resetPasswordOtpSchema = z.object({
  email: emailSchema,
  code: otpCodeSchema,
  password: strictPasswordSchema,
});

const verifyEmailOtpSchema = z.object({
  code: otpCodeSchema,
});

const otpRequestSchema = z.object({
  email: emailSchema,
});

const otpLoginSchema = z.object({
  email: emailSchema,
  code: otpCodeSchema,
});

const googleAuthSchema = z.object({
  credential: z.string().min(1, 'Missing Google credential'),
});

// Applied to profile edits too, not just registration — otherwise someone
// could register with a real name and rename to a blocked word afterward.
const updateProfileSchema = z.object({
  name: nameSchema.optional(),
  bio: z.string().max(300, 'Bio must be at most 300 characters').optional(),
  avatar: z.string().optional(),
  notificationPreferences: z
    .object({
      comment: z.boolean().optional(),
      reply: z.boolean().optional(),
      like: z.boolean().optional(),
      follow: z.boolean().optional(),
    })
    .optional(),
});

const interestsSchema = z.object({
  interests: z.array(z.enum(CATEGORIES)).max(CATEGORIES.length),
  preferredLanguages: z.array(z.enum(LANGUAGE_CODES)).min(1).optional(),
});

const deactivateAccountSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  days: z.union([z.literal(14), z.literal(21), z.literal(30)]),
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordOtpSchema,
  verifyEmailOtpSchema,
  otpRequestSchema,
  otpLoginSchema,
  googleAuthSchema,
  interestsSchema,
  updateProfileSchema,
  deactivateAccountSchema,
};
