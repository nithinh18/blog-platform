const Comment = require('../models/Comment');
const Post = require('../models/Post');
const User = require('../models/User');
const { notify } = require('../services/notificationService');

const withViewerState = (comment, userId) => {
  const obj = comment.toObject ? comment.toObject() : comment;
  const uid = userId ? String(userId) : null;
  return {
    ...obj,
    likeCount: (obj.likes || []).length,
    isLiked: uid ? (obj.likes || []).some((l) => String(l) === uid) : false,
  };
};

// Removes comments by currently-deactivated users, promoting their replies
// (from still-active users) up to where the removed comment was — so a
// deactivated user's own words disappear without silently dropping other
// people's replies underneath them.
const pruneDeactivated = (nodes, deactivatedIds) => {
  const result = [];
  nodes.forEach((node) => {
    const prunedReplies = pruneDeactivated(node.replies, deactivatedIds);
    if (deactivatedIds.has(String(node.user?._id))) {
      result.push(...prunedReplies);
    } else {
      node.replies = prunedReplies;
      result.push(node);
    }
  });
  return result;
};

// @desc    Get comments for a post as a threaded tree
// @route   GET /api/comments/:postId
const getComments = async (req, res, next) => {
  try {
    const flat = await Comment.find({ post: req.params.postId })
      .populate('user', 'name avatar')
      .sort({ createdAt: 1 });

    const byId = new Map();
    flat.forEach((c) => byId.set(String(c._id), { ...withViewerState(c, req.user?._id), replies: [] }));

    const roots = [];
    byId.forEach((c) => {
      if (c.parentComment && byId.has(String(c.parentComment))) {
        byId.get(String(c.parentComment)).replies.push(c);
      } else {
        roots.push(c);
      }
    });

    roots.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const deactivatedIds = new Set((await User.deactivatedIds()).map(String));
    const visible = deactivatedIds.size ? pruneDeactivated(roots, deactivatedIds) : roots;

    res.json({ comments: visible });
  } catch (err) {
    next(err);
  }
};

// @desc    Add comment (or reply, via parentId) to a post
// @route   POST /api/comments/:postId
const addComment = async (req, res, next) => {
  try {
    const { comment, parentId } = req.body;

    if (!comment || !comment.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    let parent = null;
    if (parentId) {
      parent = await Comment.findById(parentId);
      if (!parent) {
        return res.status(404).json({ message: 'Parent comment not found' });
      }
    }

    const newComment = await Comment.create({
      post: post._id,
      user: req.user._id,
      comment: comment.trim(),
      parentComment: parent ? parent._id : null,
    });

    post.commentCount += 1;
    await post.save();

    if (parent) {
      await notify({
        recipient: parent.user,
        actor: req.user._id,
        type: 'reply',
        post: post._id,
        comment: newComment._id,
      });
    } else {
      await notify({
        recipient: post.author,
        actor: req.user._id,
        type: 'comment',
        post: post._id,
        comment: newComment._id,
      });
    }

    const populated = await newComment.populate('user', 'name avatar');

    res.status(201).json({ comment: { ...withViewerState(populated, req.user._id), replies: [] } });
  } catch (err) {
    next(err);
  }
};

// @desc    Edit own comment
// @route   PUT /api/comments/:id
const updateComment = async (req, res, next) => {
  try {
    const { comment } = req.body;

    const existing = await Comment.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (existing.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this comment' });
    }

    if (!comment || !comment.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    existing.comment = comment.trim();
    await existing.save();

    const populated = await existing.populate('user', 'name avatar');

    res.json({ comment: withViewerState(populated, req.user._id) });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete own comment (or any comment as admin)
// @route   DELETE /api/comments/:id
const deleteComment = async (req, res, next) => {
  try {
    const existing = await Comment.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (existing.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    const childCount = await Comment.countDocuments({ parentComment: existing._id });
    await Comment.deleteMany({ parentComment: existing._id });
    await existing.deleteOne();

    await Post.findByIdAndUpdate(existing.post, { $inc: { commentCount: -1 - childCount } });

    res.json({ message: 'Comment deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle like on a comment
// @route   POST /api/comments/:id/like
const toggleCommentLike = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const uid = String(req.user._id);
    const alreadyLiked = comment.likes.some((l) => String(l) === uid);

    if (alreadyLiked) {
      comment.likes = comment.likes.filter((l) => String(l) !== uid);
    } else {
      comment.likes.push(req.user._id);
    }

    await comment.save();
    res.json({ likeCount: comment.likes.length, isLiked: !alreadyLiked });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getComments,
  addComment,
  updateComment,
  deleteComment,
  toggleCommentLike,
};
