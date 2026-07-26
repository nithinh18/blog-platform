const express = require('express');
const { CATEGORIES, LANGUAGES } = require('../config/constants');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ categories: CATEGORIES, languages: LANGUAGES });
});

module.exports = router;
