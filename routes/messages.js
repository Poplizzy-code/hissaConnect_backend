const express = require('express');
const {
  sendDirectMessage,
  sendGroupMessage,
  createGroup,
  getConversations,
  getGroups,
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Direct messages
router.post('/direct/:recipientId', protect, sendDirectMessage);
router.get('/conversations', protect, getConversations);

// Group messages
router.post('/group/:groupId', protect, sendGroupMessage);
router.post('/groups', protect, createGroup);
router.get('/groups', protect, getGroups);

module.exports = router;