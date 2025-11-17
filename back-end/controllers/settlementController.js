// backend/controllers/settlementController.js
const asyncHandler = require('express-async-handler');
const { Settlement, Group } = require('../models/schema');
const { calculateAndSaveSettlements } = require('../utils/calculateSettlement');

// -------------------------------------------
// GET SETTLEMENT DETAILS
// -------------------------------------------
const getSettlementDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if it's a pseudo ID (expense-based settlement)
  if (id.includes('-')) {
    res.status(400);
    throw new Error('Invalid settlement ID. Use actual settlement records for payments.');
  }

  const settlement = await Settlement.findById(id)
    .populate('debtor', 'name email username _id')
    .populate('creditor', 'name email username _id')
    .populate('group', 'name');

  if (!settlement) {
    res.status(404);
    throw new Error('Settlement not found');
  }

  res.status(200).json(settlement);
});

// -------------------------------------------
// SUBMIT PAYMENT PROOF (Debtor pays creditor)
// -------------------------------------------
const submitPaymentProof = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;
  const currentUserId = req.user._id;

  // Handle both real settlement IDs and pseudo IDs
  let settlement;
  
  if (id.includes('-')) {
    // Pseudo ID format: expenseId-userId
    // This means we need to create a new settlement or find existing one
    res.status(400);
    throw new Error('Please use the proper settlement system. Create a settlement first.');
  }

  settlement = await Settlement.findById(id);
  if (!settlement) {
    res.status(404);
    throw new Error('Settlement not found');
  }

  // Verify the current user is the debtor
  if (settlement.debtor.toString() !== currentUserId.toString()) {
    res.status(403);
    throw new Error('Only the debtor can submit payment proof');
  }

  let paymentProofUrl = '';
  if (req.file) {
    paymentProofUrl = `/${req.file.path.replace(/\\/g, '/')}`;
  }

  // Update settlement status to pending verification
  settlement.status = 'paid_pending_verification';
  settlement.paymentProof = paymentProofUrl;
  settlement.paidAt = new Date();
  settlement.paidAmount = parseFloat(amount);

  await settlement.save();

  res.status(200).json({
    message: 'Payment proof submitted successfully',
    settlement,
  });
});

// -------------------------------------------
// VERIFY PAYMENT (Creditor verifies payment)
// -------------------------------------------
const verifyPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { action } = req.body; // 'accept' or 'reject'
  const currentUserId = req.user._id;

  let settlement;

  if (id.includes('-')) {
    res.status(400);
    throw new Error('Invalid settlement ID');
  }

  settlement = await Settlement.findById(id);
  if (!settlement) {
    res.status(404);
    throw new Error('Settlement not found');
  }

  // Verify the current user is the creditor
  if (settlement.creditor.toString() !== currentUserId.toString()) {
    res.status(403);
    throw new Error('Only the creditor can verify payment');
  }

  if (action === 'accept') {
    settlement.status = 'completed';
    settlement.verifiedAt = new Date();
    await settlement.save();

    // Recalculate settlements for the group
    if (settlement.group) {
      await calculateAndSaveSettlements(settlement.group);
    }

    res.status(200).json({
      message: 'Payment verified successfully',
      settlement,
    });
  } else if (action === 'reject') {
    settlement.status = 'pending';
    settlement.paymentProof = '';
    settlement.paidAt = null;
    settlement.paidAmount = 0;
    await settlement.save();

    res.status(200).json({
      message: 'Payment rejected. Status reset to pending.',
      settlement,
    });
  } else {
    res.status(400);
    throw new Error('Invalid action. Use "accept" or "reject"');
  }
});

module.exports = {
  getSettlementDetails,
  submitPaymentProof,
  verifyPayment,
};