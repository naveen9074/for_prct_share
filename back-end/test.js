const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB Connection Successful'))
  .catch(err => console.error('❌ Connection Failed:', err.message))
  .finally(() => process.exit());