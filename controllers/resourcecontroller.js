const Resource = require('../models/resource');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'hissaconnect-resources',
    allowed_formats: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'],
  },
});

const upload = multer({ storage }).single('file');

// @desc Upload resource
// @route POST /api/admin/upload-resource
// @access Private/Admin
exports.uploadResource = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: 'File upload error: ' + err.message,
      });
    }

    const { title, description, level, section, fileType } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file',
      });
    }

    try {
      const resource = await Resource.create({
        title,
        description,
        level,
        section,
        fileType,
        fileUrl: req.file.path,
        uploadedBy: req.user.id,
      });

      res.status(201).json({
        success: true,
        message: 'Resource uploaded successfully',
        data: resource,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });
};

// @desc Get resources by level
// @route GET /api/resources/academic/:level
// @access Private
exports.getResourcesByLevel = async (req, res) => {
  try {
    const { level } = req.params;
    const { section } = req.query;

    let query = { level };
    if (section) query.section = section;

    const resources = await Resource.find(query).populate('uploadedBy', 'firstName lastName');

    res.status(200).json({
      success: true,
      data: resources,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc Get all resources
// @route GET /api/resources
// @access Private
exports.getAllResources = async (req, res) => {
  try {
    const resources = await Resource.find().populate('uploadedBy', 'firstName lastName');

    res.status(200).json({
      success: true,
      data: resources,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};