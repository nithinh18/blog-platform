const mongoose = require('mongoose');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');
const PostRevision = require('../models/PostRevision');
const { notify } = require('../services/notificationService');
const {
  trendingScore,
  relatedPosts,
  personalizedFeed,
  buildTagAffinity,
  collaborativeRecommendations,
  searchSuggestions,
} = require('../utils/algorithms');

const findByIdOrSlug = (id) => {
  const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { slug: id };
  return Post.findOne(query);
};

const withViewerState = (post, userId) => {
  const obj = post.toObject ? post.toObject() : post;
  const uid = userId ? String(userId) : null;

  // Never ship the raw list of who-voted-for-what to the client — reduce to
  // counts + the viewer's own choice, same shape voteOnPoll() returns.
  let poll;
  if (obj.poll && obj.poll.options?.length) {
    let myVote = null;
    const options = obj.poll.options.map((opt, idx) => {
      if (uid && (opt.votes || []).some((v) => String(v) === uid)) myVote = idx;
      return { text: opt.text, voteCount: (opt.votes || []).length };
    });
    poll = {
      question: obj.poll.question,
      options,
      myVote,
      totalVotes: options.reduce((sum, o) => sum + o.voteCount, 0),
    };
  }

  return {
    ...obj,
    poll,
    likeCount: (obj.likes || []).length,
    isLiked: uid ? (obj.likes || []).some((l) => String(l) === uid) : false,
  };
};

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parseJsonArray = (raw) => {
  if (raw === undefined) return undefined;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return String(raw)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
};

// @desc    Get all live posts (search, category/tag/language filter, pagination)
// @route   GET /api/posts
const getPosts = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 6, 1);
    const skip = (page - 1) * limit;

    const conditions = [];
    let ownAuthorView = false;

    if (req.query.author) {
      conditions.push({ author: req.query.author });
      ownAuthorView = Boolean(req.user && String(req.user._id) === String(req.query.author));
    }

    // Owners get an unrestricted view of their own posts (drafts, scheduled)
    // in the dashboard; everyone else only ever sees what's actually live
    // (and not authored by a currently-deactivated account).
    if (!ownAuthorView) {
      conditions.push(await Post.visibleFilter());
    }

    if (req.query.category) conditions.push({ category: req.query.category });
    if (req.query.tag) conditions.push({ tags: req.query.tag.toLowerCase() });
    if (req.query.language) conditions.push({ language: req.query.language });

    if (req.query.search) {
      const regex = new RegExp(escapeRegex(req.query.search), 'i');
      conditions.push({ $or: [{ title: regex }, { content: regex }, { tags: regex }] });
    }

    const filter = conditions.length ? { $and: conditions } : {};

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .populate('author', 'name email avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Post.countDocuments(filter),
    ]);

    res.json({
      posts: posts.map((p) => withViewerState(p, req.user?._id)),
      page,
      totalPages: Math.max(Math.ceil(total / limit), 1),
      totalPosts: total,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Trending posts (recency + engagement decay ranking)
// @route   GET /api/posts/trending
const getTrending = async (req, res, next) => {
  try {
    const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
    const filter = await Post.visibleFilter();
    if (req.query.language) filter.language = req.query.language;

    const posts = await Post.find(filter)
      .populate('author', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(200); // candidate pool, then re-ranked in memory

    const ranked = posts
      .map((p) => ({ post: p, score: trendingScore(p) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((r) => withViewerState(r.post, req.user?._id));

    res.json({ posts: ranked });
  } catch (err) {
    next(err);
  }
};

// @desc    Personalized "For You" feed based on interests, language, follows, and tag affinity
// @route   GET /api/posts/feed
const getFeed = async (req, res, next) => {
  try {
    const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);

    const candidatePool = await Post.find(await Post.visibleFilter())
      .populate('author', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(300);

    const engagedPosts = candidatePool.filter((p) =>
      (p.likes || []).some((l) => String(l) === String(req.user._id))
    );
    const likedTagWeights = buildTagAffinity(engagedPosts);

    const ranked = personalizedFeed(req.user, candidatePool, { likedTagWeights }).slice(0, limit);

    res.json({ posts: ranked.map((p) => withViewerState(p, req.user._id)) });
  } catch (err) {
    next(err);
  }
};

// @desc    "Because you liked..." collaborative-filter recommendations
// @route   GET /api/posts/recommended
const getRecommended = async (req, res, next) => {
  try {
    const limit = Math.max(parseInt(req.query.limit, 10) || 6, 1);
    const posts = await Post.find(await Post.visibleFilter())
      .populate('author', 'name email avatar')
      .limit(300);

    const recommended = collaborativeRecommendations(req.user._id, posts, limit);
    res.json({ posts: recommended.map((p) => withViewerState(p, req.user._id)) });
  } catch (err) {
    next(err);
  }
};

// @desc    Search-as-you-type suggestions
// @route   GET /api/posts/search-suggestions?q=
const getSearchSuggestions = async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json({ posts: [] });

    const posts = await Post.find(await Post.visibleFilter())
      .populate('author', 'name email avatar')
      .limit(300);

    const suggestions = searchSuggestions(q, posts, 6);
    res.json({ posts: suggestions.map((p) => withViewerState(p, req.user?._id)) });
  } catch (err) {
    next(err);
  }
};

// @desc    All distinct tags currently in use
// @route   GET /api/posts/tags
const getTags = async (req, res, next) => {
  try {
    const tags = await Post.distinct('tags', await Post.visibleFilter());
    res.json({ tags: tags.sort() });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single post (by id or slug) + related posts, increments view count
// @route   GET /api/posts/:id
const getPost = async (req, res, next) => {
  try {
    const post = await findByIdOrSlug(req.params.id).populate('author', 'name email avatar bio');
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const isOwner = req.user && String(post.author._id) === String(req.user._id);
    const isAdmin = req.user && req.user.role === 'admin';
    if (!post.isLive() && !isOwner && !isAdmin) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (!isOwner && !isAdmin) {
      const author = await User.findById(post.author._id);
      if (author?.isDeactivated()) {
        return res.status(404).json({ message: 'Post not found' });
      }
    }

    if (!isOwner) {
      post.views += 1;
      await post.save();
    }

    const candidatePool = await Post.find({
      ...(await Post.visibleFilter()),
      _id: { $ne: post._id },
      category: post.category,
    })
      .populate('author', 'name email avatar')
      .limit(100);

    const related = relatedPosts(post, candidatePool, 4);

    res.json({
      post: withViewerState(post, req.user?._id),
      related: related.map((p) => withViewerState(p, req.user?._id)),
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create post
// @route   POST /api/posts
const createPost = async (req, res, next) => {
  try {
    const { title, content, category, language, status, imageAlt, scheduledFor } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    let scheduledDate = null;
    if (scheduledFor) {
      scheduledDate = new Date(scheduledFor);
      if (Number.isNaN(scheduledDate.getTime())) {
        return res.status(400).json({ message: 'Invalid scheduled date' });
      }
    }

    let poll;
    if (req.body.poll) {
      try {
        const parsed = JSON.parse(req.body.poll);
        if (parsed && parsed.question && Array.isArray(parsed.options) && parsed.options.length >= 2) {
          poll = { question: parsed.question, options: parsed.options.map((text) => ({ text, votes: [] })) };
        }
      } catch {
        // ignore malformed poll payload
      }
    }

    const image = req.file ? `/uploads/${req.file.filename}` : req.body.image || '';

    const post = await Post.create({
      title,
      content,
      category,
      tags: parseJsonArray(req.body.tags) || [],
      language: language || 'en',
      status: status === 'draft' ? 'draft' : 'published',
      scheduledFor: scheduledDate,
      image,
      imageAlt: imageAlt || '',
      poll,
      author: req.user._id,
    });

    const populated = await post.populate('author', 'name email avatar');

    res.status(201).json({ post: withViewerState(populated, req.user._id) });
  } catch (err) {
    next(err);
  }
};

// @desc    Update post (owner or admin) — snapshots the previous version first
// @route   PUT /api/posts/:id
const updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to edit this post' });
    }

    const { title, content, category, image, imageAlt, language, status, scheduledFor } = req.body;
    const nextTags = parseJsonArray(req.body.tags);

    const contentChanging =
      (title !== undefined && title !== post.title) ||
      (content !== undefined && content !== post.content) ||
      (category !== undefined && category !== post.category) ||
      (nextTags !== undefined && JSON.stringify(nextTags) !== JSON.stringify(post.tags));

    if (contentChanging) {
      await PostRevision.create({
        post: post._id,
        title: post.title,
        content: post.content,
        category: post.category,
        tags: post.tags,
        editedBy: req.user._id,
      });
    }

    if (title !== undefined) post.title = title;
    if (content !== undefined) post.content = content;
    if (category !== undefined) post.category = category;
    if (language !== undefined) post.language = language;
    if (imageAlt !== undefined) post.imageAlt = imageAlt;
    if (status !== undefined) post.status = status === 'draft' ? 'draft' : 'published';
    if (nextTags !== undefined) post.tags = nextTags;

    if (scheduledFor !== undefined) {
      if (!scheduledFor) {
        post.scheduledFor = null;
      } else {
        const scheduledDate = new Date(scheduledFor);
        if (Number.isNaN(scheduledDate.getTime())) {
          return res.status(400).json({ message: 'Invalid scheduled date' });
        }
        post.scheduledFor = scheduledDate;
      }
    }

    if (req.file) {
      post.image = `/uploads/${req.file.filename}`;
    } else if (image !== undefined) {
      post.image = image;
    }

    await post.save();
    const populated = await post.populate('author', 'name email avatar');

    res.json({ post: withViewerState(populated, req.user._id) });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete post (owner or admin)
// @route   DELETE /api/posts/:id
const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await Comment.deleteMany({ post: post._id });
    await PostRevision.deleteMany({ post: post._id });
    await User.updateMany({ bookmarks: post._id }, { $pull: { bookmarks: post._id } });
    await post.deleteOne();

    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// @desc    Get revision history for a post (owner or admin only)
// @route   GET /api/posts/:id/revisions
const getRevisions = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view revisions for this post' });
    }

    const revisions = await PostRevision.find({ post: post._id })
      .populate('editedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ revisions });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle like on a post
// @route   POST /api/posts/:id/like
const toggleLike = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const uid = String(req.user._id);
    const alreadyLiked = post.likes.some((l) => String(l) === uid);

    if (alreadyLiked) {
      post.likes = post.likes.filter((l) => String(l) !== uid);
    } else {
      post.likes.push(req.user._id);
      if (String(post.author) !== uid) {
        await notify({ recipient: post.author, actor: req.user._id, type: 'like', post: post._id });
      }
    }

    await post.save();
    res.json({ likeCount: post.likes.length, isLiked: !alreadyLiked });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle bookmark on a post
// @route   POST /api/posts/:id/bookmark
const toggleBookmark = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const alreadyBookmarked = req.user.bookmarks.some((b) => String(b) === String(post._id));

    if (alreadyBookmarked) {
      req.user.bookmarks = req.user.bookmarks.filter((b) => String(b) !== String(post._id));
    } else {
      req.user.bookmarks.push(post._id);
    }

    await req.user.save();
    res.json({ isBookmarked: !alreadyBookmarked });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current user's bookmarked posts
// @route   GET /api/posts/bookmarks/mine
const getBookmarks = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'bookmarks',
      populate: { path: 'author', select: 'name email avatar' },
    });

    const deactivatedIds = new Set((await User.deactivatedIds()).map(String));
    const visibleBookmarks = deactivatedIds.size
      ? user.bookmarks.filter((p) => !deactivatedIds.has(String(p.author?._id)))
      : user.bookmarks;

    res.json({ posts: visibleBookmarks.map((p) => withViewerState(p, req.user._id)) });
  } catch (err) {
    next(err);
  }
};

// @desc    Vote on a post's poll (one vote per user, switching is allowed)
// @route   POST /api/posts/:id/poll/vote
const voteOnPoll = async (req, res, next) => {
  try {
    const { optionIndex } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post || !post.poll || !post.poll.options?.length) {
      return res.status(404).json({ message: 'This post has no poll' });
    }
    if (
      typeof optionIndex !== 'number' ||
      optionIndex < 0 ||
      optionIndex >= post.poll.options.length
    ) {
      return res.status(400).json({ message: 'Invalid poll option' });
    }

    const uid = String(req.user._id);
    post.poll.options.forEach((opt) => {
      opt.votes = opt.votes.filter((v) => String(v) !== uid);
    });
    post.poll.options[optionIndex].votes.push(req.user._id);

    await post.save();
    res.json({
      poll: {
        question: post.poll.question,
        options: post.poll.options.map((o) => ({ text: o.text, voteCount: o.votes.length })),
        myVote: optionIndex,
        totalVotes: post.poll.options.reduce((sum, o) => sum + o.votes.length, 0),
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPosts,
  getTrending,
  getFeed,
  getRecommended,
  getSearchSuggestions,
  getTags,
  getPost,
  createPost,
  updatePost,
  deletePost,
  getRevisions,
  toggleLike,
  toggleBookmark,
  getBookmarks,
  voteOnPoll,
};
