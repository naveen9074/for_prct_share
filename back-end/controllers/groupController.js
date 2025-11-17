// backend/controllers/groupController.js
const asyncHandler = require("express-async-handler");
const { Group, User, Expense, Settlement } = require("../models/schema");
const {
  calculateAndSaveSettlements,
  computeBalances,
} = require("../utils/calculateSettlement");


// -----------------------------------------------------
// GET ALL GROUPS FOR CURRENT USER
// -----------------------------------------------------
const getGroups = asyncHandler(async (req, res) => {
  const groups = await Group.find({
    members: { $in: [req.user._id] },
  }).populate("createdBy", "username");

  res.json(groups);
});


// -----------------------------------------------------
// CREATE GROUP
// -----------------------------------------------------
const createGroup = asyncHandler(async (req, res) => {
  const { name, members, dueDate } = req.body;

  if (!name || !members || members.length === 0) {
    res.status(400);
    throw new Error("Group name and at least one member required");
  }

  // Include the creator as a member
  const finalMembers = [...new Set([...members, req.user._id.toString()])];

  const group = await Group.create({
    name,
    members: finalMembers,
    createdBy: req.user._id,
    dueDate: dueDate || null,
  });

  res.status(201).json(group);
});


// -----------------------------------------------------
// ADD MEMBER TO GROUP
// -----------------------------------------------------
const addMember = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  const group = await Group.findById(req.params.id);

  if (!group) {
    res.status(404);
    throw new Error("Group not found");
  }

  if (String(group.createdBy) !== String(req.user._id)) {
    res.status(401);
    throw new Error("Only group creator can add members");
  }

  const userToAdd = await User.findOne({ phone });

  if (!userToAdd) {
    res.status(404);
    throw new Error("User not found");
  }

  if (group.members.includes(userToAdd._id)) {
    return res.json({ message: "User already in group" });
  }

  group.members.push(userToAdd._id);
  await group.save();

  res.json({ message: "Member added", group });
});


// -----------------------------------------------------
// DELETE GROUP
// -----------------------------------------------------
const deleteGroup = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id);

  if (!group) {
    res.status(404);
    throw new Error("Group not found");
  }

  if (String(group.createdBy) !== String(req.user._id)) {
    res.status(401);
    throw new Error("Only group creator can delete the group");
  }

  await Expense.deleteMany({ group: group._id });
  await Settlement.deleteMany({ group: group._id });

  await group.deleteOne();

  res.json({ message: "Group deleted successfully" });
});


// -----------------------------------------------------
// GET GROUP DETAILS
// -----------------------------------------------------
const getGroupDetails = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id)
    .populate("members", "username")
    .populate("createdBy", "username");

  if (!group) {
    res.status(404);
    throw new Error("Group not found");
  }

  if (!group.members.some((m) => m._id.equals(req.user._id))) {
    res.status(401);
    throw new Error("Not authorized to view this group");
  }

  await calculateAndSaveSettlements(group._id);

  const expenses = await Expense.find({ group: req.params.id })
    .populate("paidBy", "username")
    .populate("splits.user", "username");

  const settlements = await Settlement.find({ group: req.params.id })
    .populate("debtor", "username")
    .populate("creditor", "username");

  const settlementsWithFlags = settlements.map((s) => {
    const obj = s.toObject();
    obj.isCurrentUserDebtor = String(s.debtor._id) === String(req.user._id);
    obj.isCurrentUserCreditor = String(s.creditor._id) === String(req.user._id);
    return obj;
  });

  const balancesMap = computeBalances(expenses, group.members);

  const payments = await Settlement.find({
    group: group._id,
    status: { $in: ["paid_pending_verification", "verified"] },
  });

  payments.forEach((p) => {
    const debtor = p.debtor.toString();
    const creditor = p.creditor.toString();
    const amt = Number(p.amount_paid || p.amount || 0);

    if (balancesMap.has(debtor)) balancesMap.get(debtor).balance += amt;
    if (balancesMap.has(creditor)) balancesMap.get(creditor).balance -= amt;
  });

  const currentUserId = req.user._id.toString();
  const currentUserNet = balancesMap.has(currentUserId)
    ? Number(balancesMap.get(currentUserId).balance.toFixed(2))
    : 0;

  const expensePayments = await Settlement.aggregate([
    {
      $match: {
        group: group._id,
        expenseId: { $ne: null },
      },
    },
    {
      $group: {
        _id: "$expenseId",
        totalPaid: { $sum: { $ifNull: ["$amount_paid", "$amount"] } },
      },
    },
  ]);

  const paidMap = new Map();
  expensePayments.forEach((e) =>
    paidMap.set(String(e._id), Number(e.totalPaid || 0))
  );

  const expensesAnnotated = expenses.map((exp) => {
    const paid = paidMap.get(String(exp._id)) || 0;
    const isSettled = paid + 0.001 >= Number(exp.amount || 0);
    const obj = exp.toObject();
    obj.isSettled = isSettled;
    return obj;
  });

  res.json({
    group,
    expenses: expensesAnnotated,
    settlements: settlementsWithFlags,
    currentUserNet,
  });
});


// -----------------------------------------------------
// EXPORT ALL CONTROLLERS
// -----------------------------------------------------
module.exports = {
  getGroups,
  createGroup,
  getGroupDetails,
  addMember,
  deleteGroup,
};
