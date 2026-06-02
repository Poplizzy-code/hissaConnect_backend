const express = require('express');
const { getResourcesByLevel, getAllResources } = require('../controllers/resourcecontroller');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', getAllResources);
router.get('/academic/:level', protect, getResourcesByLevel);

module.exports = router;