const Message = require('../models/Message');
const User = require('../models/User');

// @desc Send direct message
// @route POST /api/messages/direct/:recipientId
// @access Private
exports.sendDirectMessage = async (req, res) => {
  try {
    const { recipientId } = req.params;
    const { content } = req.body;
    const senderId = req.user.id;

    // Find or create conversation
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

    // Add message
    conversation.messages.push({
      sender: senderId,
      content,
      timestamp: new Date(),
    });

    await conversation.save();

    res.status(200).json({
      success: true,
      message: 'Message sent successfully',
      data: conversation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc Send group message
// @route POST /api/messages/group/:groupId
// @access Private
exports.sendGroupMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { content } = req.body;
    const senderId = req.user.id;

    const group = await Message.findById(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found',
      });
    }

    group.messages.push({
      sender: senderId,
      content,
      timestamp: new Date(),
    });

    await group.save();

    res.status(200).json({
      success: true,
      message: 'Message sent successfully',
      data: group,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc Create group chat
// @route POST /api/messages/groups
// @access Private
exports.createGroup = async (req, res) => {
  try {
    const { name } = req.body;
    const createdBy = req.user.id;

    const group = await Message.create({
      conversationType: 'group',
      groupName: name,
      participants: [createdBy],
      createdBy,
      messages: [],
    });

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      data: group,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc Get user conversations
// @route GET /api/messages/conversations
// @access Private
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await Message.find({
      conversationType: 'direct',
      participants: userId,
    }).populate('participants', 'firstName lastName');

    res.status(200).json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc Get user groups
// @route GET /api/messages/groups
// @access Private
exports.getGroups = async (req, res) => {
  try {
    const userId = req.user.id;

    const groups = await Message.find({
      conversationType: 'group',
      participants: userId,
    }).populate('participants', 'firstName lastName');

    res.status(200).json({
      success: true,
      data: groups,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};