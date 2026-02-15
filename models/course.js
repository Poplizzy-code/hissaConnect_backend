const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    courseCode: {
      type: String,
      required: [true, 'Please provide a course code'],
      unique: true,
      uppercase: true,
    },
    courseName: {
      type: String,
      required: [true, 'Please provide a course name'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a course description'],
    },
    department: {
      type: String,
      required: [true, 'Please specify the department'],
      enum: ['History', 'International Studies', 'Combined'],
    },
    level: {
      type: String,
      enum: ['100', '200', '300', '400'], // Academic levels
      required: true,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    enrolledStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    totalEnrolled: {
      type: Number,
      default: 0,
    },
    lectureNotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LectureNote',
      },
    ],
    pastQuestions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PastQuestion',
      },
    ],
    discussionForum: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DiscussionForum',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Course', courseSchema);