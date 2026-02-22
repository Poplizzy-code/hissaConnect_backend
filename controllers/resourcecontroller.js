const Resource = require('../models/resource');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use memory storage instead
const upload = multer({ storage: multer.memoryStorage() }).single('file');

// @desc Upload resource
// @route POST /api/admin/upload-resource
// @access Private/Admin
exports.uploadResource = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: 'File upload error: ' + err.message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }

    const { title, description, level, section, fileType } = req.body;

    try {
      const isImage = req.file.mimetype.startsWith('image/');
      const resourceType = isImage ? 'image' : 'raw';

      // Upload to Cloudinary directly
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'hissaconnect-resources',
            resource_type: resourceType,
            public_id: `${Date.now()}-${req.file.originalname.replace(/\s+/g, '-')}`,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });

      const resource = await Resource.create({
        title,
        description,
        level,
        section,
        fileType,
        fileUrl: uploadResult.secure_url,
        uploadedBy: req.user.id,
      });

      res.status(201).json({ success: true, message: 'Resource uploaded successfully', data: resource });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
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
    res.status(200).json({ success: true, data: resources });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get all resources
// @route GET /api/resources
// @access Private
exports.getAllResources = async (req, res) => {
  try {
    const resources = await Resource.find().populate('uploadedBy', 'firstName lastName');
    res.status(200).json({ success: true, data: resources });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};