require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { startCronJobs } = require('./src/jobs/recurringJob');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB then start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 FinVault API running on port ${PORT}`);
    console.log(`📦 Environment: ${process.env.NODE_ENV}`);
    console.log(`🔗 URL: http://localhost:${PORT}/api/v1\n`);
  });
  // Start cron jobs after DB connection
  startCronJobs();
}).catch((err) => {
  console.error('❌ Failed to connect to MongoDB:', err.message);
  process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
  process.exit(1);
});
