const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a title'],
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    level: {
      type: String,
      enum: ['100', '200', '300', '400'],
      required: true,
    },
    section: {
      type: String,
      enum: ['academic', 'research'],
      required: true,
    },
    fileType: {
      type: String,
      enum: ['pdf', 'image', 'document'],
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    downloads: {
      type: Number,
      default: 0,
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Resource', resourceSchema);