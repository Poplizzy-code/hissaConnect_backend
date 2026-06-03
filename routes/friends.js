const express = require('express');
const {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  getNotifications,
  markNotificationsRead,
  getFriendStatus,
} = require('../controllers/friendcontroller');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/request/:userId', protect, sendFriendRequest);
router.post('/accept/:requestId', protect, acceptFriendRequest);
router.post('/decline/:requestId', protect, declineFriendRequest);
router.get('/notifications', protect, getNotifications);
router.put('/notifications/read', protect, markNotificationsRead);
router.get('/status/:targetId', protect, getFriendStatus);

module.exports = router;
