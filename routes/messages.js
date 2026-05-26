const express = require('express');
const {
  sendDirectMessage,
  sendGroupMessage,
  createGroup,
  joinGroup,
  getConversations,
  getGroups,
  getConversation,
  getUsers,
} = require('../controllers/messagecontroller');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Users for DM search
router.get('/users', protect, getUsers);

// Direct messages
router.post('/direct/:recipientId', protect, sendDirectMessage);
router.get('/conversations', protect, getConversations);
router.get('/conversation/:id', protect, getConversation);

// Group messages
router.post('/group/:groupId', protect, sendGroupMessage);
router.post('/groups', protect, createGroup);
router.get('/groups', protect, getGroups);
router.post('/groups/:groupId/join', protect, joinGroup);

module.exports = router;
