const express = require('express');
const { makeAdmin, getAllUsers } = require('../controllers/adminController');
const { uploadResource, getResourcesByLevel, getAllResources } = require('../controllers/resourceController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Admin only routes
router.post('/make-admin/:userId', protect, authorize('admin'), makeAdmin);
router.get('/users', protect, authorize('admin'), getAllUsers);
router.post('/upload-resource', protect, authorize('admin'), uploadResource);

module.exports = router;