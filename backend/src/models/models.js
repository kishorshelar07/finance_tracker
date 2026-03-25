const mongoose = require('mongoose');

// ─── Recurring Transaction ─────────────────────────────
const recurringTransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, required: true, enum: ['income', 'expense'] },
  amount: { type: Number, required: true, min: 0.01 },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  description: { type: String, required: true, trim: true },
  frequency: { type: String, required: true, enum: ['daily', 'weekly', 'monthly', 'yearly'] },
  nextDueDate: { type: Date, required: true },
  endDate: { type: Date, default: null },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

recurringTransactionSchema.index({ userId: 1, isActive: 1, nextDueDate: 1 });

// ─── Budget ────────────────────────────────────────────
const budgetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  amountLimit: { type: Number, required: true, min: 1 },
  period: { type: String, required: true, enum: ['weekly', 'monthly', 'yearly'], default: 'monthly' },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, default: null },
}, { timestamps: true });

budgetSchema.index({ userId: 1, categoryId: 1 }, { unique: true });

// ─── Budget Alert ──────────────────────────────────────
const budgetAlertSchema = new mongoose.Schema({
  budgetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Budget', required: true },
  alertAtPercent: { type: Number, enum: [50, 75, 90, 100] },
  isSent: { type: Boolean, default: false },
  sentAt: Date,
});

// ─── Savings Goal ──────────────────────────────────────
const savingsGoalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  targetAmount: { type: Number, required: true, min: 1 },
  currentAmount: { type: Number, default: 0, min: 0 },
  deadline: { type: Date, default: null },
  icon: { type: String, default: '🎯' },
  color: { type: String, default: '#1A56DB' },
  status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
});

savingsGoalSchema.virtual('percentComplete').get(function () {
  return Math.min(Math.round((this.currentAmount / this.targetAmount) * 100), 100);
});
savingsGoalSchema.virtual('remaining').get(function () {
  return Math.max(this.targetAmount - this.currentAmount, 0);
});

// ─── Savings Contribution ──────────────────────────────
const savingsContributionSchema = new mongoose.Schema({
  goalId: { type: mongoose.Schema.Types.ObjectId, ref: 'SavingsGoal', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true, min: 0.01 },
  note: { type: String, trim: true },
  contributedAt: { type: Date, default: Date.now },
});

// ─── Refresh Token ─────────────────────────────────────
const refreshTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  isRevoked: { type: Boolean, default: false },
  userAgent: String,
  ipAddress: String,
}, { timestamps: true });

// TTL index — auto-delete expired tokens
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = {
  RecurringTransaction: mongoose.model('RecurringTransaction', recurringTransactionSchema),
  Budget: mongoose.model('Budget', budgetSchema),
  BudgetAlert: mongoose.model('BudgetAlert', budgetAlertSchema),
  SavingsGoal: mongoose.model('SavingsGoal', savingsGoalSchema),
  SavingsContribution: mongoose.model('SavingsContribution', savingsContributionSchema),
  RefreshToken: mongoose.model('RefreshToken', refreshTokenSchema),
};
