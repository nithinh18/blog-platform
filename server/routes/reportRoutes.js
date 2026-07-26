const express = require('express');
const { reportPost, reportComment } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/post/:id', reportPost);
router.post('/comment/:id', reportComment);

module.exports = router;
