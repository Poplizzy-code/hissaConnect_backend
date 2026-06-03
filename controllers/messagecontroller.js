const Message = require('../models/message');
const User = require('../models/user');
const FriendRequest = require('../models/friendRequest');

// @desc Send direct message (REST fallback)
// @route POST /api/messages/direct/:recipientId
// @access Private
exports.sendDirectMessage = async (req, res) => {
  try {
    const { recipientId } = req.params;
    const { content } = req.body;
    const senderId = req.user.id;

    let conversation = await Message.findOne({
      conversationType: 'direct',
      participants: { $all: [senderId, recipientId] },
    });

    if (!conversation) {
      conversation = await Message.create({
        conversationType: 'direct',
        participants: [senderId, recipientId],
        messages: [],
      });
    }

    conversation.messages.push({ sender: senderId, content, timestamp: new Date() });
    await conversation.save();

    res.status(200).json({ success: true, data: conversation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Send group message (REST fallback)
// @route POST /api/messages/group/:groupId
// @access Private
exports.sendGroupMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { content } = req.body;
    const senderId = req.user.id;

    const group = await Message.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    group.messages.push({ sender: senderId, content, timestamp: new Date() });
    await group.save();

    res.status(200).json({ success: true, data: group });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Create group chat
// @route POST /api/messages/groups
// @access Private
exports.createGroup = async (req, res) => {
  try {
    const { name, memberIds } = req.body;
    const createdBy = req.user.id;

    const participants = [createdBy, ...(memberIds || [])];

    const group = await Message.create({
      conversationType: 'group',
      groupName: name,
      participants,
      createdBy,
      messages: [],
    });

    await group.populate('participants', 'firstName lastName');

    res.status(201).json({ success: true, data: group });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Join a group
// @route POST /api/messages/groups/:groupId/join
// @access Private
exports.joinGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const group = await Message.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    if (!group.participants.includes(userId)) {
      group.participants.push(userId);
      await group.save();
    }

    await group.populate('participants', 'firstName lastName');
    res.status(200).json({ success: true, data: group });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get user's direct message conversations
// @route GET /api/messages/conversations
// @access Private
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await Message.find({
      conversationType: 'direct',
      participants: userId,
    }).populate('participants', 'firstName lastName profilePhoto');

    res.status(200).json({ success: true, data: conversations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get user's groups
// @route GET /api/messages/groups
// @access Private
exports.getGroups = async (req, res) => {
  try {
    const userId = req.user.id;

    const groups = await Message.find({
      conversationType: 'group',
      participants: userId,
    }).populate('participants', 'firstName lastName profilePhoto');

    res.status(200).json({ success: true, data: groups });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get single conversation with messages (populated senders)
// @route GET /api/messages/conversation/:id
// @access Private
exports.getConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const conversation = await Message.findOne({
      _id: id,
      participants: userId,
    }).populate('participants', 'firstName lastName profilePhoto');

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    // Populate sender info in each message
    const User = require('../models/user');
    const senderIds = [...new Set(conversation.messages.map((m) => m.sender.toString()))];
    const senders = await User.find({ _id: { $in: senderIds } }).select('firstName lastName profilePhoto');
    const senderMap = {};
    senders.forEach((s) => { senderMap[s._id.toString()] = s; });

    const populatedMessages = conversation.messages.map((msg) => ({
      _id: msg._id,
      sender: senderMap[msg.sender.toString()] || { _id: msg.sender },
      content: msg.content,
      timestamp: msg.timestamp,
    }));

    res.status(200).json({
      success: true,
      data: { ...conversation.toObject(), messages: populatedMessages },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get all users (for starting DMs)
// @route GET /api/messages/users
// @access Private
exports.getUsers = async (req, res) => {
  try {
    const userId = req.user.id;
    const { search } = req.query;

    let query = { _id: { $ne: userId } };
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { matricNo: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('firstName lastName matricNo currentLevel profilePhoto')
      .limit(20);

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Add a member to an existing group
// @route POST /api/messages/groups/:groupId/add-member
// @access Private
exports.addMemberToGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;
    const group = await Message.findById(groupId);
    if (!group || group.conversationType !== 'group') {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }
    if (!group.participants.map((p) => p.toString()).includes(userId)) {
      group.participants.push(userId);
      await group.save();
    }
    await group.populate('participants', 'firstName lastName profilePhoto');
    res.status(200).json({ success: true, data: group });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get all users for People tab (with isFriend + request status)
// @route GET /api/messages/all-users
// @access Private
exports.getAllUsers = async (req, res) => {
  try {
    const userId = req.user.id;
    const { search } = req.query;

    let query = { _id: { $ne: userId } };
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { matricNo: { $regex: search, $options: 'i' } },
      ];
    }

    const [me, users, pendingRequests] = await Promise.all([
      User.findById(userId).select('friends'),
      User.find(query).select('firstName lastName matricNo currentLevel profilePhoto bio').limit(50),
      FriendRequest.find({
        $or: [{ sender: userId }, { receiver: userId }],
        status: 'pending',
      }),
    ]);

    const myFriendIds = new Set((me.friends || []).map((f) => f.toString()));

    const requestMap = {};
    pendingRequests.forEach((r) => {
      const otherId = r.sender.toString() === userId ? r.receiver.toString() : r.sender.toString();
      requestMap[otherId] = {
        status: r.sender.toString() === userId ? 'sent' : 'received',
        requestId: r._id,
      };
    });

    const result = users.map((u) => ({
      ...u.toObject(),
      isFriend: myFriendIds.has(u._id.toString()),
      requestStatus: requestMap[u._id.toString()]?.status || null,
      requestId: requestMap[u._id.toString()]?.requestId || null,
    }));

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
