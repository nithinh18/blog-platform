const express = require('express');
const {
  getOverview,
  listUsers,
  setUserRole,
  deleteUser,
  listReports,
  resolveReport,
  dismissReport,
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.use(protect, adminOnly);

router.get('/overview', getOverview);
router.get('/users', listUsers);
router.put('/users/:id/role', setUserRole);
router.delete('/users/:id', deleteUser);

router.get('/reports', listReports);
router.put('/reports/:id/resolve', resolveReport);
router.put('/reports/:id/dismiss', dismissReport);

module.exports = router;
