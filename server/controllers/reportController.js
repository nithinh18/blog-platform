const Report = require('../models/Report');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

// @desc    Report a post
// @route   POST /api/reports/post/:id
const reportPost = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: 'A reason is required' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const existing = await Report.findOne({
      reporter: req.user._id,
      targetType: 'post',
      post: post._id,
      status: 'open',
    });
    if (existing) {
      return res.status(400).json({ message: 'You have already reported this post' });
    }

    await Report.create({
      reporter: req.user._id,
      targetType: 'post',
      post: post._id,
      reason: reason.trim(),
    });

    res.status(201).json({ message: 'Report submitted, thank you' });
  } catch (err) {
    next(err);
  }
};

// @desc    Report a comment
// @route   POST /api/reports/comment/:id
const reportComment = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: 'A reason is required' });
    }

    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const existing = await Report.findOne({
      reporter: req.user._id,
      targetType: 'comment',
      comment: comment._id,
      status: 'open',
    });
    if (existing) {
      return res.status(400).json({ message: 'You have already reported this comment' });
    }

    await Report.create({
      reporter: req.user._id,
      targetType: 'comment',
      comment: comment._id,
      reason: reason.trim(),
    });

    res.status(201).json({ message: 'Report submitted, thank you' });
  } catch (err) {
    next(err);
  }
};

module.exports = { reportPost, reportComment };
