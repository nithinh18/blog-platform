const mongoose = require('mongoose');
const { LANGUAGE_CODES } = require('../config/constants');

const slugify = (text) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 150,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    image: {
      type: String,
      default: '',
    },
    imageAlt: {
      type: String,
      default: '',
      maxlength: 200,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      default: 'General',
    },
    tags: {
      type: [String],
      default: [],
      set: (tags) => tags.map((t) => t.toLowerCase().trim()).filter(Boolean),
    },
    language: {
      type: String,
      enum: LANGUAGE_CODES,
      default: 'en',
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'published',
    },
    // When set to a future date, a "published" post is held back from public
    // listing/reading until that moment passes — see isLive() below.
    scheduledFor: {
      type: Date,
      default: null,
    },
    readingTime: {
      type: Number,
      default: 1,
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    commentCount: {
      type: Number,
      default: 0,
    },
    poll: {
      question: { type: String, maxlength: 200 },
      options: [
        {
          text: { type: String, maxlength: 100 },
          votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        },
      ],
    },
  },
  { timestamps: true }
);

// `default_language: 'none'` disables Snowball stemming/stopword removal
// (MongoDB's stemmer doesn't cover Indian languages anyway), and
// `language_override` is pointed at an unused field name so MongoDB never
// mistakes our own `language` field (the post's content language) for its
// per-document text-search language directive.
postSchema.index(
  { title: 'text', content: 'text', tags: 'text' },
  { default_language: 'none', language_override: 'textSearchLanguage' }
);

// Query filter fragment for "publicly visible right now" — published, and
// not scheduled for a future date.
postSchema.statics.liveFilter = function () {
  return {
    status: 'published',
    $or: [{ scheduledFor: null }, { scheduledFor: { $lte: new Date() } }],
  };
};

postSchema.methods.isLive = function () {
  return this.status === 'published' && (!this.scheduledFor || this.scheduledFor <= new Date());
};

// Same as liveFilter(), but also excludes posts by currently-deactivated
// authors — see User.deactivatedIds()/isDeactivated().
postSchema.statics.visibleFilter = async function () {
  const filter = this.liveFilter();
  const deactivatedIds = await mongoose.model('User').deactivatedIds();
  if (deactivatedIds.length) filter.author = { $nin: deactivatedIds };
  return filter;
};

postSchema.pre('validate', function (next) {
  if (this.isModified('content')) {
    const words = this.content.trim().split(/\s+/).length;
    this.readingTime = Math.max(1, Math.round(words / 200));
  }

  if (this.isModified('title') || !this.slug) {
    const base = slugify(this.title || 'post');
    this.slug = `${base}-${Math.random().toString(36).slice(2, 8)}`;
  }

  next();
});

module.exports = mongoose.model('Post', postSchema);
