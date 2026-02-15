 const mongoose = require('mongoose');

const discussionSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a discussion title'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Please provide discussion content'],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      enum: ['General', 'Study Group', 'Question', 'Announcement', 'Debate'],
      default: 'General',
    },
    tags: [
      {
        type: String,
      },
    ],
    replies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reply',
      },
    ],
    replyCount: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    isLocked: {
      type: Boolean,
      default: false, // Moderators can lock discussions
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Discussion', discussionSchema);