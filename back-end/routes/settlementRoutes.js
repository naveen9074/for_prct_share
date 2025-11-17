// backend/routes/settlementRoutes.js
const express = require('express');
const router = express.Router();
const {
  getSettlementDetails,
  submitPaymentProof,
  verifyPayment,
} = require('../controllers/settlementController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Get details for a single settlement (for verify screen)
router.get('/:id', protect, getSettlementDetails);

// Submit payment proof (debtor)
router.patch('/:id/pay', protect, upload.single('paymentProof'), submitPaymentProof);

// Verify or reject payment (creditor)
router.patch('/:id/verify', protect, verifyPayment);

module.exports = router;