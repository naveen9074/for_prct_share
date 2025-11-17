// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  updateUserProfile,
  getUserUpiId  
} = require('../controllers/userController');
// DELETE THIS LINE:
// const { getUserUpiId } = require('../controllers/settlementController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Private routes
router.route('/profile')
  .patch(protect, updateUserProfile);

router.route('/me')
  .get(protect, getUserProfile);
  
// --- NEW ROUTE ---
// Get just the UPI ID for a specific user (the creditor)
router.route('/upi/:userId').get(protect, getUserUpiId);

module.exports = router;