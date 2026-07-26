const express = require('express');
const {
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
} = require('../controllers/postController');
const { protect } = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');

const router = express.Router();

// The whole blog is members-only: every read route requires a logged-in
// user, not just the write routes.
router.use(protect);

// Specific routes first so they don't get swallowed by /:id
router.get('/trending', getTrending);
router.get('/feed', getFeed);
router.get('/recommended', getRecommended);
router.get('/search-suggestions', getSearchSuggestions);
router.get('/tags', getTags);
router.get('/bookmarks/mine', getBookmarks);

// Uploads a standalone image for embedding inline in post content (markdown),
// separate from a post's cover image.
router.post('/upload-image', ...uploadImage('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No image file provided' });
  res.status(201).json({ url: `/uploads/${req.file.filename}` });
});

router.get('/', getPosts);
router.get('/:id', getPost);
router.post('/', ...uploadImage('image'), createPost);
router.put('/:id', ...uploadImage('image'), updatePost);
router.delete('/:id', deletePost);
router.get('/:id/revisions', getRevisions);
router.post('/:id/like', toggleLike);
router.post('/:id/bookmark', toggleBookmark);
router.post('/:id/poll/vote', voteOnPoll);

module.exports = router;
