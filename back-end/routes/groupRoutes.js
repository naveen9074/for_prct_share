// backend/routes/groupRoutes.js
const express = require('express');
const router = express.Router();

const {
  getGroups,
  createGroup,
  getGroupDetails,
  addMember,
  deleteGroup
} = require('../controllers/groupController');

const { protect } = require('../middleware/authMiddleware');

// GET all groups / Create group
router.route('/')
  .get(protect, getGroups)
  .post(protect, createGroup);

// GET group details / DELETE group
router.route('/:id')
  .get(protect, getGroupDetails)
  .delete(protect, deleteGroup);

// Add new members to group
router.route('/:id/members')
  .post(protect, addMember);

module.exports = router;
