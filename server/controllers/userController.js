const User = require('../models/User');
const Post = require('../models/Post');
const { notify } = require('../services/notificationService');

const computeBadges = ({ postCount, followerCount, totalLikes }) => {
  const badges = [];
  if (postCount >= 1) badges.push({ key: 'first-post', label: 'First Post' });
  if (postCount >= 10) badges.push({ key: 'prolific-writer', label: 'Prolific Writer' });
  if (postCount >= 50) badges.push({ key: 'veteran-writer', label: 'Veteran Writer' });
  if (followerCount >= 10) badges.push({ key: 'rising-voice', label: 'Rising Voice' });
  if (followerCount >= 100) badges.push({ key: 'influencer', label: 'Influencer' });
  if (totalLikes >= 50) badges.push({ key: 'crowd-favorite', label: 'Crowd Favorite' });
  return badges;
};

// @desc    Public author profile + their published posts
// @route   GET /api/users/:id
const getPublicProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.isDeactivated()) {
      return res.status(404).json({ message: 'User not found' });
    }

    const [posts, followerCount] = await Promise.all([
      Post.find({ author: user._id, ...Post.liveFilter() })
        .populate('author', 'name email avatar')
        .sort({ createdAt: -1 }),
      User.countDocuments({ following: user._id }),
    ]);

    const totalLikes = posts.reduce((sum, p) => sum + (p.likes?.length || 0), 0);

    const isFollowing = req.user
      ? req.user.following.some((f) => String(f) === String(user._id))
      : false;

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        bio: user.bio,
        avatar: user.avatar,
        createdAt: user.createdAt,
        followerCount,
        badges: computeBadges({ postCount: posts.length, followerCount, totalLikes }),
      },
      posts,
      isFollowing,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Follow/unfollow toggle
// @route   POST /api/users/:id/follow
const toggleFollow = async (req, res, next) => {
  try {
    if (req.params.id === String(req.user._id)) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    const target = await User.findById(req.params.id);
    if (!target) {
      return res.status(404).json({ message: 'User not found' });
    }

    const alreadyFollowing = req.user.following.some((f) => String(f) === String(target._id));

    if (alreadyFollowing) {
      req.user.following = req.user.following.filter((f) => String(f) !== String(target._id));
    } else {
      req.user.following.push(target._id);
      await notify({ recipient: target._id, actor: req.user._id, type: 'follow' });
    }

    await req.user.save();

    res.json({ isFollowing: !alreadyFollowing });
  } catch (err) {
    next(err);
  }
};

// @desc    Top writers leaderboard, ranked by published posts + total likes received
// @route   GET /api/users/leaderboard
const getLeaderboard = async (req, res, next) => {
  try {
    const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);

    const rows = await Post.aggregate([
      { $match: await Post.visibleFilter() },
      {
        $group: {
          _id: '$author',
          postCount: { $sum: 1 },
          totalLikes: { $sum: { $size: { $ifNull: ['$likes', []] } } },
          totalComments: { $sum: { $ifNull: ['$commentCount', 0] } },
        },
      },
      { $addFields: { score: { $add: ['$postCount', { $multiply: ['$totalLikes', 2] }, '$totalComments'] } } },
      { $sort: { score: -1 } },
      { $limit: limit },
    ]);

    const users = await User.find({ _id: { $in: rows.map((r) => r._id) } }).select(
      'name avatar bio'
    );
    const userMap = new Map(users.map((u) => [String(u._id), u]));

    const leaderboard = rows
      .filter((r) => userMap.has(String(r._id)))
      .map((r) => ({
        user: userMap.get(String(r._id)),
        postCount: r.postCount,
        totalLikes: r.totalLikes,
        totalComments: r.totalComments,
        score: r.score,
      }));

    res.json({ leaderboard });
  } catch (err) {
    next(err);
  }
};

module.exports = { getPublicProfile, toggleFollow, getLeaderboard };
