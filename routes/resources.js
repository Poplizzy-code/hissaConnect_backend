const express = require('express');
const { getResourcesByLevel, getAllResources } = require('../controllers/resourcecontroller');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getAllResources);
router.get('/academic/:level', getResourcesByLevel);

module.exports = router;