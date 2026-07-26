const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Report = require('../models/Report');
const PostRevision = require('../models/PostRevision');
const Notification = require('../models/Notification');

// @desc    Platform-wide stats + recent content for the admin panel
// @route   GET /api/admin/overview
const getOverview = async (req, res, next) => {
  try {
    const [userCount, postCount, commentCount, openReportCount, recentPosts, recentUsers] =
      await Promise.all([
        User.countDocuments(),
        Post.countDocuments(),
        Comment.countDocuments(),
        Report.countDocuments({ status: 'open' }),
        Post.find().populate('author', 'name email').sort({ createdAt: -1 }).limit(10),
        User.find().sort({ createdAt: -1 }).limit(10),
      ]);

    res.json({
      stats: { userCount, postCount, commentCount, openReportCount },
      recentPosts,
      recentUsers: recentUsers.map((u) => u.toSafeObject()),
    });
  } catch (err) {
    next(err);
  }
};

// @desc    List all users
// @route   GET /api/admin/users
const listUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ users: users.map((u) => u.toSafeObject()) });
  } catch (err) {
    next(err);
  }
};

// @desc    Change a user's role
// @route   PUT /api/admin/users/:id/role
const setUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a user and fully cascade-clean their content and references
// @route   DELETE /api/admin/users/:id
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userId = user._id;
    const postIds = (await Post.find({ author: userId }).select('_id')).map((p) => p._id);

    await Promise.all([
      Comment.deleteMany({ $or: [{ user: userId }, { post: { $in: postIds } }] }),
      PostRevision.deleteMany({ post: { $in: postIds } }),
      Post.deleteMany({ author: userId }),
      Notification.deleteMany({ $or: [{ recipient: userId }, { actor: userId }] }),
      Report.deleteMany({ reporter: userId }),
      Post.updateMany({ likes: userId }, { $pull: { likes: userId } }),
      Comment.updateMany({ likes: userId }, { $pull: { likes: userId } }),
      User.updateMany({ following: userId }, { $pull: { following: userId } }),
      User.updateMany({ bookmarks: { $in: postIds } }, { $pull: { bookmarks: { $in: postIds } } }),
    ]);

    await user.deleteOne();

    res.json({ message: 'User and their content deleted' });
  } catch (err) {
    next(err);
  }
};

// @desc    List reports for the moderation queue
// @route   GET /api/admin/reports
const listReports = async (req, res, next) => {
  try {
    const status = req.query.status || 'open';
    const reports = await Report.find({ status })
      .populate('reporter', 'name email')
      .populate({ path: 'post', select: 'title slug author', populate: { path: 'author', select: 'name' } })
      .populate({ path: 'comment', select: 'comment user', populate: { path: 'user', select: 'name' } })
      .sort({ createdAt: -1 });

    res.json({ reports });
  } catch (err) {
    next(err);
  }
};

// @desc    Resolve a report, optionally deleting the reported content
// @route   PUT /api/admin/reports/:id/resolve
const resolveReport = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (req.body.removeContent) {
      if (report.targetType === 'post' && report.post) {
        await Comment.deleteMany({ post: report.post });
        await PostRevision.deleteMany({ post: report.post });
        await Post.findByIdAndDelete(report.post);
      } else if (report.targetType === 'comment' && report.comment) {
        await Comment.findByIdAndDelete(report.comment);
      }
    }

    report.status = 'resolved';
    await report.save();

    res.json({ message: 'Report resolved' });
  } catch (err) {
    next(err);
  }
};

// @desc    Dismiss a report without taking action
// @route   PUT /api/admin/reports/:id/dismiss
const dismissReport = async (req, res, next) => {
  try {
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status: 'dismissed' },
      { new: true }
    );
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    res.json({ message: 'Report dismissed' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getOverview,
  listUsers,
  setUserRole,
  deleteUser,
  listReports,
  resolveReport,
  dismissReport,
};
