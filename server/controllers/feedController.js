const User = require('../models/User');
const Post = require('../models/Post');

const escapeXml = (str = '') =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

// @desc    Personal RSS feed, scoped by a private per-user token (the site
//          requires login for everything, so this can't be a public feed —
//          it's the closest equivalent: an unguessable personal feed URL).
// @route   GET /api/feed/:feedToken.rss
const getRssFeed = async (req, res, next) => {
  try {
    const token = req.params.feedToken.replace(/\.rss$/, '');
    const user = await User.findOne({ feedToken: token });
    if (!user) {
      return res.status(404).json({ message: 'Feed not found' });
    }

    const posts = await Post.find(await Post.visibleFilter())
      .populate('author', 'name')
      .sort({ createdAt: -1 })
      .limit(30);

    const siteUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    const items = posts
      .map((p) => {
        const link = `${siteUrl}/posts/${p.slug}`;
        return `
    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${new Date(p.createdAt).toUTCString()}</pubDate>
      <author>${escapeXml(p.author?.name || 'Unknown')}</author>
      <category>${escapeXml(p.category)}</category>
      <description>${escapeXml(p.content.slice(0, 300))}</description>
    </item>`;
      })
      .join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>BlogManthan — Personal Feed</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>Your personal BlogManthan feed of the latest posts</description>${items}
  </channel>
</rss>`;

    res.set('Content-Type', 'application/rss+xml; charset=utf-8');
    res.send(xml);
  } catch (err) {
    next(err);
  }
};

module.exports = { getRssFeed };
