import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import { ImagePlus, X, Eye, Pencil, Image as ImageIcon, ListChecks } from 'lucide-react';
import { CATEGORIES } from '../utils/categoryStyles.js';
import { UI_LANGUAGES } from '../i18n/index.js';
import { uploadInlineImage } from '../services/postService';

const TEMPLATES = [
  {
    key: 'howto',
    content: `## Why this matters\n\nA short intro on the problem you're solving.\n\n## Step 1\n\nDescribe the first step.\n\n## Step 2\n\nDescribe the next step.\n\n## Wrapping up\n\nSummarize what the reader should take away.`,
  },
  {
    key: 'listicle',
    content: `## Intro\n\nOne line setting up the list.\n\n1. First point\n2. Second point\n3. Third point\n\n## Final thoughts\n\nWrap it up.`,
  },
  {
    key: 'story',
    content: `It started when...\n\n## What happened\n\nTell the story.\n\n## What I learned\n\nShare the takeaway.`,
  },
];

const DRAFT_KEY = 'postform:new-draft';

const PostForm = ({ initialValues, onSubmit }) => {
  const { t } = useTranslation();
  const isEditing = Boolean(initialValues);
  const textareaRef = useRef(null);

  const localDraft = !isEditing && (() => {
    try {
      return JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
    } catch {
      return null;
    }
  })();

  const [title, setTitle] = useState(initialValues?.title || localDraft?.title || '');
  const [content, setContent] = useState(initialValues?.content || localDraft?.content || '');
  const [category, setCategory] = useState(initialValues?.category || localDraft?.category || 'General');
  const [language, setLanguage] = useState(initialValues?.language || 'en');
  const [tags, setTags] = useState(initialValues?.tags || localDraft?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(initialValues?.image || '');
  const [imageAlt, setImageAlt] = useState(initialValues?.imageAlt || '');
  const [mode, setMode] = useState('write');
  const [scheduledFor, setScheduledFor] = useState(
    initialValues?.scheduledFor ? initialValues.scheduledFor.slice(0, 16) : ''
  );
  const [pollEnabled, setPollEnabled] = useState(Boolean(initialValues?.poll?.question));
  const [pollQuestion, setPollQuestion] = useState(initialValues?.poll?.question || '');
  const [pollOptions, setPollOptions] = useState(
    initialValues?.poll?.options?.map((o) => o.text) || ['', '']
  );
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [savedDraftNotice, setSavedDraftNotice] = useState(false);

  // Auto-save to localStorage for brand-new (not-yet-created) posts only —
  // editing an existing post already persists to the server on save.
  useEffect(() => {
    if (isEditing) return undefined;
    const handle = setTimeout(() => {
      if (title.trim() || content.trim()) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, content, category, tags }));
        setSavedDraftNotice(true);
        setTimeout(() => setSavedDraftNotice(false), 1500);
      }
    }, 1200);
    return () => clearTimeout(handle);
  }, [title, content, category, tags, isEditing]);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const insertAtCursor = (snippet) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setContent((prev) => `${prev}\n${snippet}`);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    setContent((prev) => `${prev.slice(0, start)}${snippet}${prev.slice(end)}`);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + snippet.length;
    });
  };

  const handleInlineImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = await uploadInlineImage(file);
      insertAtCursor(`\n![image](${data.url})\n`);
    } catch (err) {
      setError(err.response?.data?.message || t('post.imageUploadFailed'));
    } finally {
      e.target.value = '';
    }
  };

  const applyTemplate = (key) => {
    const tmpl = TEMPLATES.find((tp) => tp.key === key);
    if (!tmpl) return;
    if (content.trim() && !window.confirm(t('post.confirmReplaceTemplate'))) return;
    setContent(tmpl.content);
    setMode('write');
  };

  const addTag = (e) => {
    if (e.key !== 'Enter' && e.key !== ',') return;
    e.preventDefault();
    const value = tagInput.trim().toLowerCase();
    if (value && !tags.includes(value)) {
      setTags((prev) => [...prev, value]);
    }
    setTagInput('');
  };

  const removeTag = (tag) => setTags((prev) => prev.filter((t2) => t2 !== tag));

  const updatePollOption = (idx, value) =>
    setPollOptions((prev) => prev.map((o, i) => (i === idx ? value : o)));

  const addPollOption = () => setPollOptions((prev) => (prev.length < 5 ? [...prev, ''] : prev));
  const removePollOption = (idx) =>
    setPollOptions((prev) => (prev.length > 2 ? prev.filter((_, i) => i !== idx) : prev));

  const submit = async (status) => {
    setError('');

    if (!title.trim() || !content.trim()) {
      setError(t('post.titleContentRequired'));
      return;
    }

    if (pollEnabled) {
      const validOptions = pollOptions.map((o) => o.trim()).filter(Boolean);
      if (!pollQuestion.trim() || validOptions.length < 2) {
        setError(t('post.pollRequiresQuestionAndOptions'));
        return;
      }
    }

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('content', content.trim());
    formData.append('category', category);
    formData.append('language', language);
    formData.append('status', status);
    formData.append('tags', JSON.stringify(tags));
    formData.append('imageAlt', imageAlt);
    if (scheduledFor) formData.append('scheduledFor', new Date(scheduledFor).toISOString());
    if (pollEnabled) {
      formData.append(
        'poll',
        JSON.stringify({
          question: pollQuestion.trim(),
          options: pollOptions.map((o) => o.trim()).filter(Boolean),
        })
      );
    }
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      setSubmitting(true);
      await onSubmit(formData);
      if (!isEditing) localStorage.removeItem(DRAFT_KEY);
    } catch (err) {
      setError(err.response?.data?.message || t('post.genericError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-lg border border-slate-200 dark:border-slate-800">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 text-sm px-4 py-2.5 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-200">
          {t('post.title')}
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-900"
          placeholder={t('post.titlePlaceholder')}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-200">
            {t('post.category')}
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setCategory(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  category === c
                    ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-200">
            {t('post.language')}
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {UI_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-200">
          {t('post.tags')}
        </label>
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 focus-within:ring-2 focus-within:ring-brand-500">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium px-2.5 py-1 rounded-full"
            >
              #{tag}
              <button type="button" onClick={() => removeTag(tag)}>
                <X size={12} />
              </button>
            </span>
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={addTag}
            placeholder={tags.length === 0 ? t('post.tagsHelp') : ''}
            className="flex-1 min-w-[100px] bg-transparent text-sm focus:outline-none py-1"
          />
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            {t('post.content')}
          </label>
          <div className="flex items-center gap-2">
            <select
              onChange={(e) => {
                applyTemplate(e.target.value);
                e.target.value = '';
              }}
              defaultValue=""
              className="text-xs rounded-full border border-slate-200 dark:border-slate-700 bg-transparent px-2.5 py-1 text-slate-500 dark:text-slate-400"
            >
              <option value="" disabled>
                {t('post.templatesLabel')}
              </option>
              {TEMPLATES.map((tmpl) => (
                <option key={tmpl.key} value={tmpl.key}>
                  {t(`post.templates.${tmpl.key}`)}
                </option>
              ))}
            </select>
            <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-brand-400">
              <ImageIcon size={12} /> {t('post.insertImage')}
              <input type="file" accept="image/*" onChange={handleInlineImage} className="hidden" />
            </label>
            <div className="flex rounded-full border border-slate-200 dark:border-slate-700 p-0.5">
              <button
                type="button"
                onClick={() => setMode('write')}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  mode === 'write'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Pencil size={12} /> {t('post.write')}
              </button>
              <button
                type="button"
                onClick={() => setMode('preview')}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  mode === 'preview'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Eye size={12} /> {t('post.preview')}
              </button>
            </div>
          </div>
        </div>

        {mode === 'write' ? (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm leading-relaxed font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-900"
            placeholder={t('post.writeMarkdownPlaceholder')}
          />
        ) : (
          <div className="prose prose-slate dark:prose-invert max-w-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-5 py-4 min-h-[15rem] text-sm">
            {content ? (
              <ReactMarkdown>{content}</ReactMarkdown>
            ) : (
              <p className="text-slate-400">{t('post.nothingToPreview')}</p>
            )}
          </div>
        )}
        <div className="flex justify-between mt-1.5">
          <p className="text-xs text-slate-400">
            {t('post.wordsAndChars', { words: wordCount, chars: charCount })}
          </p>
          {savedDraftNotice && <p className="text-xs text-emerald-500">{t('post.draftSavedLocally')}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-200">
          {t('post.coverImage')}
        </label>
        <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl py-8 cursor-pointer hover:border-brand-400 hover:bg-brand-50/50 dark:hover:bg-brand-500/5 transition-colors">
          <ImagePlus size={22} className="text-slate-400" />
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {t('post.uploadImage', { action: preview ? t('post.change') : t('post.upload') })}
          </span>
          <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
        </label>
        {preview && (
          <>
            <img
              src={preview}
              alt={imageAlt || t('post.preview')}
              className="mt-3 h-44 w-full rounded-xl object-cover border border-slate-200 dark:border-slate-700"
            />
            <input
              type="text"
              value={imageAlt}
              onChange={(e) => setImageAlt(e.target.value)}
              placeholder={t('post.imageAltPlaceholder')}
              className="mt-2 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-200">
          {t('post.schedule')}
        </label>
        <input
          type="datetime-local"
          value={scheduledFor}
          onChange={(e) => setScheduledFor(e.target.value)}
          className="w-full sm:w-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <p className="text-xs text-slate-400 mt-1">
          {t('post.scheduleHelp')}
        </p>
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
          <input
            type="checkbox"
            checked={pollEnabled}
            onChange={(e) => setPollEnabled(e.target.checked)}
            className="rounded border-slate-300 dark:border-slate-600 text-brand-600 focus:ring-brand-500"
          />
          <ListChecks size={15} /> {t('post.addPoll')}
        </label>
        {pollEnabled && (
          <div className="space-y-2 pl-6">
            <input
              type="text"
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              placeholder={t('post.pollQuestionPlaceholder')}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {pollOptions.map((opt, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => updatePollOption(idx, e.target.value)}
                  placeholder={t('post.pollOptionPlaceholder', { n: idx + 1 })}
                  className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                {pollOptions.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removePollOption(idx)}
                    className="text-slate-400 hover:text-rose-500"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
            {pollOptions.length < 5 && (
              <button
                type="button"
                onClick={addPollOption}
                className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
              >
                {t('post.addOption')}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={() => submit('draft')}
          disabled={submitting}
          className="sm:w-auto border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
        >
          {t('post.saveDraft')}
        </button>
        <button
          type="button"
          onClick={() => submit('published')}
          disabled={submitting}
          className="flex-1 sm:flex-none sm:w-auto bg-brand-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50"
        >
          {submitting
            ? t('post.saving')
            : scheduledFor
              ? t('post.schedulePost')
              : isEditing
                ? t('post.saveChanges')
                : t('post.publish')}
        </button>
      </div>
    </div>
  );
};

export default PostForm;
