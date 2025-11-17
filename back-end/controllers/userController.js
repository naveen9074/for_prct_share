// backend/controllers/userController.js
const { User, Settlement } = require('../models/schema');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');

// Helper function to clean phone numbers
const normalizePhone = (phoneStr) => {
  if (!phoneStr) return '';
  let cleaned = phoneStr.replace(/\D/g, ''); 
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.substring(2);
  }
  return cleaned;
};

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
exports.registerUser = asyncHandler(async (req, res) => {
  const { username, email, phoneNo, password } = req.body; 

  if (!username || !email || !phoneNo || !password) {
    res.status(400);
    throw new Error('Please add all fields');
  }

  const normalizedPhone = normalizePhone(phoneNo);
  if (normalizedPhone.length !== 10) {
    res.status(400);
    throw new Error('Please enter a valid 10-digit phone number');
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(400);
    throw new Error('User already exists with this email');
  }
  
  const existingPhone = await User.findOne({ phoneNo: normalizedPhone });
  if (existingPhone) {
    res.status(400);
    throw new Error('User already exists with this phone number');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({ 
    username, 
    email, 
    phoneNo: normalizedPhone, 
    password: hashedPassword 
  });
  await newUser.save();

  if (newUser) {
    res.status(201).json({ message: 'User registered successfully' });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Public
exports.loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    res.status(400);
    throw new Error('User not found');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    res.status(400);
    throw new Error('Invalid credentials');
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

  res.status(200).json({ 
    message: 'Login successful', 
    token,
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
      phoneNo: user.phoneNo
    } 
  });
});

// @desc    Get logged in user's profile AND dues
// @route   GET /api/users/me
// @access  Private
exports.getUserProfile = asyncHandler(async (req, res) => {
  // 1. Get the user
  const user = await User.findById(req.user._id); 

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // 2. Get all pending settlements where this user is the debtor
  const pendingDues = await Settlement.find({ 
    debtor: req.user._id, 
    status: 'pending' 
  }).populate('group', 'name');

  // 3. Send both back to the app
  res.json({
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
      phoneNo: user.phoneNo,
      upiId: user.upiId
    },
    pendingDues: pendingDues
  });
});

// @desc    Update user profile
// @route   PATCH /api/users/profile
// @access  Private
exports.updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.username = req.body.username || user.username;
    user.email = req.body.email || user.email;
    user.phoneNo = req.body.phoneNo ? normalizePhone(req.body.phoneNo) : user.phoneNo;
    user.upiId = req.body.upiId;

    if (req.body.password) {
      user.password = await bcrypt.hash(req.body.password, 10);
    }

    const updatedUser = await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        phoneNo: updatedUser.phoneNo,
        upiId: updatedUser.upiId
      }
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get a specific user's UPI ID
// @route   GET /api/users/upi/:userId
// @access  Private
exports.getUserUpiId = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId).select('upiId username email _id');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.status(200).json({
    userId: user._id,
    username: user.username,
    email: user.email,
    upiId: user.upiId || ''
  });
});