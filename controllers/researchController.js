const Research = require('../models/research');

exports.createResearch = async (req, res) => {
  try {
    const { title, description, category, link } = req.body;

    if (!title || !description || !category || !link) {
      return res.status(400).json({ success: false, message: 'Please provide all fields' });
    }

    const research = await Research.create({
      title, description, category, link,
      uploadedBy: req.user.id,
    });

    res.status(201).json({ success: true, message: 'Research opportunity added successfully', data: research });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllResearch = async (req, res) => {
  try {
    const research = await Research.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: research });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteResearch = async (req, res) => {
  try {
    await Research.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};