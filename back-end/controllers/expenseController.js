// backend/controllers/expenseController.js
const asyncHandler = require('express-async-handler');
const { Expense, Group, Settlement } = require('../models/schema');
const { calculateAndSaveSettlements } = require('../utils/calculateSettlement');

// -------------------------------------------
// ADD EXPENSE
// -------------------------------------------
const addExpense = asyncHandler(async (req, res) => {
  const { description, amount, group: groupId, splitType } = req.body;

  const group = await Group.findById(groupId);
  if (!group) {
    res.status(404);
    throw new Error("Group not found");
  }

  const members = group.members;
  let finalSplits = [];
  const parsedAmount = parseFloat(amount);

  if (splitType === "equal") {
    const splitAmount = parsedAmount / members.length;
    finalSplits = members.map((memberId) => ({
      user: memberId,
      amount: splitAmount,
    }));
  } else if (splitType === "custom") {
    finalSplits = JSON.parse(req.body.splits);
    const totalCustom = finalSplits.reduce(
      (acc, s) => acc + parseFloat(s.amount),
      0
    );

    if (Math.abs(totalCustom - parsedAmount) > 0.01) {
      res.status(400);
      throw new Error("Custom splits mismatch");
    }
  } else {
    res.status(400);
    throw new Error("Invalid split type");
  }

  let billImageUrl = "";
  if (req.file) {
    billImageUrl = `/${req.file.path.replace(/\\/g, "/")}`;
  }

  const expense = new Expense({
    group: groupId,
    paidBy: req.user._id,
    amount: parsedAmount,
    description,
    splitType,
    splits: finalSplits,
    billImage: billImageUrl,
  });

  const saved = await expense.save();

  // Recompute group-level settlements
  await calculateAndSaveSettlements(groupId);

  res.status(201).json(saved);
});

// -------------------------------------------
// GET EXPENSE DETAILS WITH SETTLEMENTS
// -------------------------------------------
const getExpenseDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const currentUserId = req.user._id;

  const expense = await Expense.findById(id)
    .populate('paidBy', 'name email username _id')
    .populate('splits.user', 'name email username _id')
    .populate('group', 'name _id');

  if (!expense) {
    res.status(404);
    throw new Error("Expense not found");
  }

  // Get settlements for this group that involve the current user
  const groupSettlements = await Settlement.find({
    group: expense.group._id,
    $or: [
      { debtor: currentUserId },
      { creditor: currentUserId }
    ]
  })
    .populate('debtor', 'name email username _id')
    .populate('creditor', 'name email username _id');

  res.status(200).json({
    expense,
    settlements: groupSettlements,
  });
});

module.exports = { addExpense, getExpenseDetails };