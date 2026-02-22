const express = require('express');
const { makeAdmin, getAllUsers } = require('../controllers/admincontroller');
const { uploadResource, getResourcesByLevel, getAllResources } = require('../controllers/resourcecontroller');
const { createResearch, getAllResearch, deleteResearch } = require('../controllers/researchController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/make-admin/:userId', protect, authorize('admin'), makeAdmin);
router.get('/users', protect, authorize('admin'), getAllUsers);
router.post('/upload-resource', protect, authorize('admin'), uploadResource);
router.post('/research', protect, authorize('admin'), createResearch);
router.get('/research', getAllResearch);
router.delete('/research/:id', protect, authorize('admin'), deleteResearch);

module.exports = router;