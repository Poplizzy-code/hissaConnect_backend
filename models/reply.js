const mongoose = require('mongoose');

const replySchema = new mongoose.Schema(
  {
    discussion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Discussion',
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Please provide reply content'],
    },
    likes: {
      type: Number,
      default: 0,
    },
    likedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isMarkedCorrect: {
      type: Boolean,
      default: false, // For marking best answers
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Reply', replySchema);