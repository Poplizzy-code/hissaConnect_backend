const mongoose = require('mongoose');

const lectureNoteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a title'],
      trim: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Please provide note content'],
    },
    topic: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fileUrl: {
      type: String, // For PDF or document uploads
      default: null,
    },
    tags: [
      {
        type: String,
      },
    ],
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
    isVerified: {
      type: Boolean,
      default: false, // Moderators verify content quality
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LectureNote', lectureNoteSchema);