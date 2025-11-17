// backend/server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');

const { notFound, errorHandler } = require('./middleware/errorMiddleware');

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import Routes with debugging
try {
  console.log('Loading userRoutes...');
  const userRoutes = require('./routes/userRoutes');
  console.log('✓ userRoutes loaded');
  if (!userRoutes) throw new Error('userRoutes is null/undefined');
  app.use('/api/users', userRoutes);
} catch (e) {
  console.error('✗ Failed to load userRoutes:', e.message);
  process.exit(1);
}

try {
  console.log('Loading groupRoutes...');
  const groupRoutes = require('./routes/groupRoutes');
  console.log('✓ groupRoutes loaded');
  if (!groupRoutes) throw new Error('groupRoutes is null/undefined');
  app.use('/api/groups', groupRoutes);
} catch (e) {
  console.error('✗ Failed to load groupRoutes:', e.message);
  process.exit(1);
}

try {
  console.log('Loading expenseRoutes...');
  const expenseRoutes = require('./routes/expenseRoutes');
  console.log('✓ expenseRoutes loaded');
  if (!expenseRoutes) throw new Error('expenseRoutes is null/undefined');
  app.use('/api/expenses', expenseRoutes);
} catch (e) {
  console.error('✗ Failed to load expenseRoutes:', e.message);
  process.exit(1);
}

try {
  console.log('Loading settlementRoutes...');
  const settlementRoutes = require('./routes/settlementRoutes');
  console.log('✓ settlementRoutes loaded');
  if (!settlementRoutes) throw new Error('settlementRoutes is null/undefined');
  app.use('/api/settlements', settlementRoutes);
} catch (e) {
  console.error('✗ Failed to load settlementRoutes:', e.message);
  process.exit(1);
}

// Serve Uploaded Images
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// Error Handlers (Must be last)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));