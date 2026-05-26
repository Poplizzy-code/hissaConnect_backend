const express = require('express');
const {
  createNews,
  getAllNews,
  getNewsById,
  deleteNews,
  togglePublish,
} = require('../controllers/newscontroller');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', getAllNews);
router.get('/:id', getNewsById);
router.post('/', protect, authorize('admin'), createNews);
router.delete('/:id', protect, authorize('admin'), deleteNews);
router.patch('/:id/toggle', protect, authorize('admin'), togglePublish);

module.exports = router;
