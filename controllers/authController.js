const User = require('../models/user');
const jwt = require('jsonwebtoken');
const { sendVerificationEmail } = require('../utils/sendEmail');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc Register - step 1: send verification code
// @route POST /api/auth/register
// @access Public
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

    const code = generateVerificationCode();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save temp user with verification code
    const user = await User.create({
      firstName, lastName, email, matricNo, currentLevel, password,
      verificationCode: code,
      verificationCodeExpiry: expiry,
      isEmailVerified: false,
    });

    await sendVerificationEmail(email, firstName, code);

    res.status(200).json({
      success: true,
      message: 'Verification code sent to your email',
      email,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Verify email code - step 2
// @route POST /api/auth/verify-email
// @access Public
exports.verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ success: false, message: 'Email already verified' });
    }

    if (user.verificationCode !== code) {
      return res.status(400).json({ success: false, message: 'Invalid verification code' });
    }

    if (user.verificationCodeExpiry < new Date()) {
      await User.findByIdAndDelete(user._id);
      return res.status(400).json({ success: false, message: 'Verification code expired. Please register again.' });
    }

    user.isEmailVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpiry = null;
    await user.save();

    const token = generateToken(user._id, user.role);

    res.status(200).json({
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

// @desc Login
// @route POST /api/auth/login
// @access Public
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

    if (!user.isEmailVerified) {
      return res.status(401).json({ success: false, message: 'Please verify your email before logging in' });
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

// @desc Get current user
// @route GET /api/auth/me
// @access Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};