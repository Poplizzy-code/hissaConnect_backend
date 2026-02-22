const mongoose = require('mongoose');

const researchSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ['scholarships', 'conferences', 'internships', 'research-grants', 'volunteering', 'careers'],
      required: true,
    },
    link: { type: String, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Research', researchSchema);