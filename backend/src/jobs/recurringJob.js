const cron = require('node-cron');
const { RecurringTransaction } = require('../models/models');
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const { sendEmail } = require('../config/email');
const User = require('../models/User');

const processRecurring = async () => {
  console.log('⏰ [CRON] Processing recurring transactions...');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = await RecurringTransaction.find({
    isActive: true,
    nextDueDate: { $lte: new Date() },
    $or: [{ endDate: null }, { endDate: { $gte: today } }],
  }).populate('categoryId accountId');

  let processed = 0;

  for (const r of due) {
    try {
      const account = await Account.findById(r.accountId);
      if (!account) continue;

      // Create transaction
      await Transaction.create({
        userId: r.userId,
        type: r.type,
        amount: r.amount,
        categoryId: r.categoryId?._id,
        accountId: r.accountId._id,
        description: r.description,
        date: new Date(),
        isRecurring: true,
        recurringId: r._id,
        autoCreated: true,
        notes: 'Created automatically from recurring rule',
      });

      // Update account balance
      if (r.type === 'income') account.balance += r.amount;
      else account.balance -= r.amount;
      account.balance = parseFloat(account.balance.toFixed(2));
      await account.save();

      // Compute next due date
      const next = new Date(r.nextDueDate);
      switch (r.frequency) {
        case 'daily':   next.setDate(next.getDate() + 1); break;
        case 'weekly':  next.setDate(next.getDate() + 7); break;
        case 'monthly': next.setMonth(next.getMonth() + 1); break;
        case 'yearly':  next.setFullYear(next.getFullYear() + 1); break;
      }
      r.nextDueDate = next;
      await r.save();

      // Send email notification
      const user = await User.findById(r.userId);
      if (user) {
        await sendEmail({
          to: user.email,
          subject: `FinVault — Recurring ${r.type} processed`,
          html: `<p>Hi ${user.name},</p>
          <p>Your recurring <strong>${r.type}</strong> of <strong>₹${r.amount}</strong> for "<em>${r.description}</em>" has been auto-created.</p>
          <p>Next due: <strong>${next.toLocaleDateString('en-IN')}</strong></p>`,
        }).catch(() => {});
      }
      processed++;
    } catch (err) {
      console.error(`Recurring error for ${r._id}:`, err.message);
    }
  }

  console.log(`✅ [CRON] Processed ${processed} recurring transactions.`);
};

const startCronJobs = () => {
  // Run daily at midnight IST (18:30 UTC)
  cron.schedule('30 18 * * *', processRecurring, { timezone: 'Asia/Kolkata' });
  console.log('🕐 Cron jobs started (recurring: daily at midnight IST)');
};

module.exports = { startCronJobs, processRecurring };
