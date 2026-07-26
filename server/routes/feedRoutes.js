const express = require('express');
const { getRssFeed } = require('../controllers/feedController');

const router = express.Router();

// Deliberately not behind `protect` — feed readers can't do interactive
// login, so this route authenticates via the unguessable :feedToken instead.
router.get('/:feedToken', getRssFeed);

module.exports = router;
