const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true },
    content: { type: String, required: [true, 'Content is required'] },
    category: {
      type: String,
      enum: ['general', 'academic', 'events', 'achievements'],
      default: 'general',
    },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    images: [
      {
        url: String,
        publicId: String,
      },
    ],
    videos: [
      {
        url: String,
        publicId: String,
        videoType: { type: String, enum: ['upload', 'youtube'], default: 'upload' },
      },
    ],
    files: [
      {
        name: String,
        url: String,
        publicId: String,
      },
    ],
    isPublished: { type: Boolean, default: true },
    publishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('News', newsSchema);
