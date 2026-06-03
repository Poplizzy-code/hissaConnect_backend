const User = require('../models/user');
const FriendRequest = require('../models/friendRequest');
const Notification = require('../models/notification');

const emitToUser = (req, userId, event, data) => {
  const io = req.app.get('io');
  const onlineUsers = req.app.get('onlineUsers');
  const socketId = onlineUsers.get(userId.toString());
  if (socketId) io.to(socketId).emit(event, data);
};

exports.sendFriendRequest = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { userId: receiverId } = req.params;

    if (senderId === receiverId) {
      return res.status(400).json({ success: false, message: 'Cannot send request to yourself' });
    }

    const existing = await FriendRequest.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
      status: 'pending',
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Friend request already exists' });
    }

    const alreadyFriends = await User.findOne({ _id: senderId, friends: receiverId });
    if (alreadyFriends) {
      return res.status(400).json({ success: false, message: 'Already connected' });
    }

    const request = await FriendRequest.create({ sender: senderId, receiver: receiverId });
    const sender = await User.findById(senderId).select('firstName lastName profilePhoto');

    const notif = await Notification.create({
      recipient: receiverId,
      sender: senderId,
      type: 'friend_request',
      message: `${sender.firstName} ${sender.lastName} sent you a friend request`,
      relatedId: request._id,
    });

    emitToUser(req, receiverId, 'notification', {
      _id: notif._id,
      type: 'friend_request',
      message: notif.message,
      sender,
      relatedId: request._id,
      read: false,
      createdAt: notif.createdAt,
    });

    res.status(201).json({ success: true, message: 'Friend request sent', data: { requestId: request._id } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;

    const request = await FriendRequest.findOne({ _id: requestId, receiver: userId, status: 'pending' });
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    request.status = 'accepted';
    await request.save();

    await User.findByIdAndUpdate(request.sender, { $addToSet: { friends: userId } });
    await User.findByIdAndUpdate(userId, { $addToSet: { friends: request.sender } });

    const accepter = await User.findById(userId).select('firstName lastName profilePhoto');

    const notif = await Notification.create({
      recipient: request.sender,
      sender: userId,
      type: 'friend_accepted',
      message: `${accepter.firstName} ${accepter.lastName} accepted your friend request`,
      relatedId: request._id,
    });

    await Notification.updateMany(
      { recipient: userId, relatedId: request._id, type: 'friend_request' },
      { read: true }
    );

    emitToUser(req, request.sender.toString(), 'notification', {
      _id: notif._id,
      type: 'friend_accepted',
      message: notif.message,
      sender: accepter,
      relatedId: request._id,
      read: false,
      createdAt: notif.createdAt,
    });

    res.status(200).json({ success: true, message: 'Friend request accepted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.declineFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;

    await FriendRequest.findOneAndUpdate(
      { _id: requestId, receiver: userId, status: 'pending' },
      { status: 'declined' }
    );

    res.status(200).json({ success: true, message: 'Request declined' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate('sender', 'firstName lastName profilePhoto');
    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user.id, read: false }, { read: true });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getFriendStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { targetId } = req.params;

    const me = await User.findById(userId).select('friends');
    const isFriend = me.friends.some((f) => f.toString() === targetId);

    const request = await FriendRequest.findOne({
      $or: [
        { sender: userId, receiver: targetId },
        { sender: targetId, receiver: userId },
      ],
      status: 'pending',
    });

    let requestStatus = null;
    let requestId = null;
    if (request) {
      requestStatus = request.sender.toString() === userId ? 'sent' : 'received';
      requestId = request._id;
    }

    res.status(200).json({ success: true, data: { isFriend, requestStatus, requestId } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
