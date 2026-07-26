const express = require('express');
const {
  getComments,
  addComment,
  updateComment,
  deleteComment,
  toggleCommentLike,
} = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// The whole blog is members-only: reading comments requires login too.
router.use(protect);

router.get('/:postId', getComments);
router.post('/:postId', addComment);
router.put('/:id', updateComment);
router.delete('/:id', deleteComment);
router.post('/:id/like', toggleCommentLike);

module.exports = router;
