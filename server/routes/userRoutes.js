const express = require('express');
const { getPublicProfile, toggleFollow, getLeaderboard } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// The whole blog is members-only: viewing an author's profile requires login too.
router.use(protect);

// Specific routes first so they don't get swallowed by /:id
router.get('/leaderboard', getLeaderboard);

router.get('/:id', getPublicProfile);
router.post('/:id/follow', toggleFollow);

module.exports = router;
