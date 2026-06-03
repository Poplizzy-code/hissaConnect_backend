const User = require('../models/user');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage() }).single('profilePhoto');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, matricNo, currentLevel, password } = req.body;

    if (!firstName || !lastName || !email || !matricNo || !currentLevel || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { matricNo }] });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists with that email or matric number' });
    }

    const user = await User.create({ firstName, lastName, email, matricNo, currentLevel, password });
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to HISSA Connect 🎉',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        matricNo: user.matricNo,
        currentLevel: user.currentLevel,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        matricNo: user.matricNo,
        currentLevel: user.currentLevel,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    try {
      const { bio, phone, dateOfBirth, currentLevel } = req.body;
      const updates = {};
      if (bio !== undefined) updates.bio = bio;
      if (phone !== undefined) updates.phone = phone;
      if (dateOfBirth !== undefined) updates.dateOfBirth = dateOfBirth || null;
      if (currentLevel) updates.currentLevel = currentLevel;

      if (req.file) {
        const uploadResult = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'hissaconnect-profiles', resource_type: 'image' },
            (error, result) => { if (error) reject(error); else resolve(result); }
          );
          stream.end(req.file.buffer);
        });
        updates.profilePhoto = uploadResult.secure_url;
      }

      const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');
      res.status(200).json({
        success: true,
        data: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          matricNo: user.matricNo,
          currentLevel: user.currentLevel,
          role: user.role,
          bio: user.bio,
          phone: user.phone,
          dateOfBirth: user.dateOfBirth,
          profilePhoto: user.profilePhoto,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
};