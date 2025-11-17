// backend/routes/expenseRoutes.js
const express = require("express");
const router = express.Router();

const upload = require("../middleware/uploadMiddleware");
const { protect } = require("../middleware/authMiddleware");

const {
  addExpense,
  getExpenseDetails
} = require("../controllers/expenseController");

// Create an expense
router.post(
  "/",
  protect,
  upload.single("billImage"),
  addExpense
);

// Get specific expense details
router.get("/:id", protect, getExpenseDetails);

module.exports = router;
