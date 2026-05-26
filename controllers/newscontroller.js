const News = require('../models/news');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage() }).fields([
  { name: 'images', maxCount: 10 },
  { name: 'videos', maxCount: 5 },
  { name: 'files', maxCount: 10 },
]);

const uploadToCloudinary = (buffer, options) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
    stream.end(buffer);
  });

// @desc Create news post
// @route POST /api/news
// @access Private/Admin
exports.createNews = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: 'Upload error: ' + err.message });
    }

    const { title, content, category, youtubeUrls } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    try {
      const images = [];
      const videos = [];
      const files = [];

      // Upload images
      if (req.files?.images) {
        for (const file of req.files.images) {
          const result = await uploadToCloudinary(file.buffer, {
            folder: 'hissaconnect-news/images',
            resource_type: 'image',
          });
          images.push({ url: result.secure_url, publicId: result.public_id });
        }
      }

      // Upload videos
      if (req.files?.videos) {
        for (const file of req.files.videos) {
          const result = await uploadToCloudinary(file.buffer, {
            folder: 'hissaconnect-news/videos',
            resource_type: 'video',
          });
          videos.push({ url: result.secure_url, publicId: result.public_id, videoType: 'upload' });
        }
      }

      // Add YouTube links
      if (youtubeUrls) {
        const urls = Array.isArray(youtubeUrls) ? youtubeUrls : [youtubeUrls];
        urls.forEach((url) => {
          if (url.trim()) videos.push({ url: url.trim(), videoType: 'youtube' });
        });
      }

      // Upload PDF/file attachments
      if (req.files?.files) {
        for (const file of req.files.files) {
          const result = await uploadToCloudinary(file.buffer, {
            folder: 'hissaconnect-news/files',
            resource_type: 'raw',
            public_id: `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`,
          });
          files.push({ name: file.originalname, url: result.secure_url, publicId: result.public_id });
        }
      }

      const news = await News.create({
        title,
        content,
        category: category || 'general',
        author: req.user.id,
        images,
        videos,
        files,
      });

      await news.populate('author', 'firstName lastName');

      res.status(201).json({ success: true, data: news });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
};

// @desc Get all published news
// @route GET /api/news
// @access Public
exports.getAllNews = async (req, res) => {
  try {
    const { category } = req.query;
    const query = { isPublished: true };
    if (category && category !== 'all') query.category = category;

    const news = await News.find(query)
      .populate('author', 'firstName lastName')
      .sort({ publishedAt: -1 });

    res.status(200).json({ success: true, data: news });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get single news post
// @route GET /api/news/:id
// @access Public
exports.getNewsById = async (req, res) => {
  try {
    const news = await News.findById(req.params.id).populate('author', 'firstName lastName');
    if (!news || !news.isPublished) {
      return res.status(404).json({ success: false, message: 'News post not found' });
    }
    res.status(200).json({ success: true, data: news });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Delete news post
// @route DELETE /api/news/:id
// @access Private/Admin
exports.deleteNews = async (req, res) => {
  try {
    const news = await News.findByIdAndDelete(req.params.id);
    if (!news) return res.status(404).json({ success: false, message: 'News post not found' });
    res.status(200).json({ success: true, message: 'News post deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Toggle publish status
// @route PATCH /api/news/:id/toggle
// @access Private/Admin
exports.togglePublish = async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) return res.status(404).json({ success: false, message: 'News post not found' });
    news.isPublished = !news.isPublished;
    await news.save();
    res.status(200).json({ success: true, data: news });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
