require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Account = require('../models/Account');
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const { Budget, SavingsGoal, SavingsContribution, RecurringTransaction } = require('../models/models');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB. Seeding...');

  // Clean up
  await Promise.all([
    User.deleteMany({ email: 'demo@finvault.app' }),
  ]);

  // Create demo user
  const password = await bcrypt.hash('Demo@1234', 12);
  const user = await User.create({
    name: 'Arjun Sharma',
    email: 'demo@finvault.app',
    password,
    currency: 'INR',
    monthlyIncome: 150000,
    savingsGoalPercent: 20,
    isVerified: true,
  });

  // Categories
  const categories = await Category.insertMany([
    { userId: user._id, name: 'Food & Dining', type: 'expense', color: '#EF4444', icon: '🍕', isDefault: true },
    { userId: user._id, name: 'Transport', type: 'expense', color: '#3B82F6', icon: '🚗', isDefault: true },
    { userId: user._id, name: 'Shopping', type: 'expense', color: '#8B5CF6', icon: '🛍️', isDefault: true },
    { userId: user._id, name: 'Entertainment', type: 'expense', color: '#F59E0B', icon: '🎬', isDefault: true },
    { userId: user._id, name: 'Healthcare', type: 'expense', color: '#10B981', icon: '💊', isDefault: true },
    { userId: user._id, name: 'Bills & Utilities', type: 'expense', color: '#6B7280', icon: '💡', isDefault: true },
    { userId: user._id, name: 'Rent / EMI', type: 'expense', color: '#DC2626', icon: '🏠', isDefault: true },
    { userId: user._id, name: 'Groceries', type: 'expense', color: '#059669', icon: '🛒', isDefault: true },
    { userId: user._id, name: 'Subscriptions', type: 'expense', color: '#7C3AED', icon: '📱', isDefault: true },
    { userId: user._id, name: 'Salary', type: 'income', color: '#059669', icon: '💰', isDefault: true },
    { userId: user._id, name: 'Freelance', type: 'income', color: '#0284C7', icon: '💻', isDefault: true },
    { userId: user._id, name: 'Investment Returns', type: 'income', color: '#D97706', icon: '📊', isDefault: true },
  ]);

  const catMap = {};
  categories.forEach(c => { catMap[c.name] = c._id; });

  // Accounts
  const accounts = await Account.insertMany([
    { userId: user._id, name: 'HDFC Savings', type: 'bank', balance: 285420.50, color: '#1A56DB', icon: '🏦' },
    { userId: user._id, name: 'Cash Wallet', type: 'cash', balance: 12350.00, color: '#059669', icon: '💵' },
    { userId: user._id, name: 'ICICI Credit Card', type: 'credit_card', balance: -45200.00, color: '#DC2626', icon: '💳' },
    { userId: user._id, name: 'Zerodha Portfolio', type: 'investment', balance: 320000.00, color: '#D97706', icon: '📈' },
  ]);

  const hdfc = accounts[0]._id;
  const cash = accounts[1]._id;
  const icici = accounts[2]._id;

  // 6 months of transactions
  const txs = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');

    txs.push({ userId: user._id, type: 'income', amount: 150000, categoryId: catMap['Salary'], accountId: hdfc, description: 'Monthly Salary — Company', date: new Date(`${yr}-${mo}-01`) });
    txs.push({ userId: user._id, type: 'expense', amount: 35000, categoryId: catMap['Rent / EMI'], accountId: hdfc, description: 'Apartment Rent — Koramangala', date: new Date(`${yr}-${mo}-02`) });
    txs.push({ userId: user._id, type: 'expense', amount: 8400 + i * 200, categoryId: catMap['Food & Dining'], accountId: cash, description: 'Monthly Food & Dining', date: new Date(`${yr}-${mo}-08`) });
    txs.push({ userId: user._id, type: 'expense', amount: 4200, categoryId: catMap['Transport'], accountId: hdfc, description: 'Petrol & Cab Rides', date: new Date(`${yr}-${mo}-12`) });
    txs.push({ userId: user._id, type: 'expense', amount: 12000 + i * 500, categoryId: catMap['Shopping'], accountId: icici, description: 'Amazon & Flipkart Orders', date: new Date(`${yr}-${mo}-15`) });
    txs.push({ userId: user._id, type: 'income', amount: 25000 + i * 1000, categoryId: catMap['Freelance'], accountId: hdfc, description: `Freelance Project — Client ${i + 1}`, date: new Date(`${yr}-${mo}-18`) });
    txs.push({ userId: user._id, type: 'expense', amount: 3500, categoryId: catMap['Entertainment'], accountId: cash, description: 'Movies & Weekend Plans', date: new Date(`${yr}-${mo}-20`) });
    txs.push({ userId: user._id, type: 'expense', amount: 6500, categoryId: catMap['Bills & Utilities'], accountId: hdfc, description: 'Electricity, Internet, Water', date: new Date(`${yr}-${mo}-22`) });
    txs.push({ userId: user._id, type: 'expense', amount: 5200, categoryId: catMap['Groceries'], accountId: cash, description: 'Monthly Groceries — BigBasket', date: new Date(`${yr}-${mo}-25`) });
    txs.push({ userId: user._id, type: 'expense', amount: 799, categoryId: catMap['Subscriptions'], accountId: icici, description: 'Netflix Subscription', date: new Date(`${yr}-${mo}-05`) });
    if (i < 3) {
      txs.push({ userId: user._id, type: 'income', amount: 15000, categoryId: catMap['Investment Returns'], accountId: hdfc, description: 'Mutual Fund Dividend', date: new Date(`${yr}-${mo}-28`) });
    }
  }

  await Transaction.insertMany(txs);

  // Budgets
  await Budget.insertMany([
    { userId: user._id, categoryId: catMap['Food & Dining'], amountLimit: 10000, period: 'monthly' },
    { userId: user._id, categoryId: catMap['Shopping'], amountLimit: 15000, period: 'monthly' },
    { userId: user._id, categoryId: catMap['Bills & Utilities'], amountLimit: 8000, period: 'monthly' },
    { userId: user._id, categoryId: catMap['Transport'], amountLimit: 5000, period: 'monthly' },
  ]);

  // Savings Goals
  const goal1 = await SavingsGoal.create({ userId: user._id, name: 'Emergency Fund', targetAmount: 300000, currentAmount: 185000, deadline: new Date('2025-12-31'), icon: '🛡️', color: '#1A56DB' });
  const goal2 = await SavingsGoal.create({ userId: user._id, name: 'Goa Vacation', targetAmount: 80000, currentAmount: 52000, deadline: new Date('2025-06-30'), icon: '🏖️', color: '#059669' });

  await SavingsContribution.insertMany([
    { goalId: goal1._id, userId: user._id, amount: 50000, note: 'Initial deposit', contributedAt: new Date('2024-10-31') },
    { goalId: goal1._id, userId: user._id, amount: 30000, note: 'Monthly savings', contributedAt: new Date('2024-11-30') },
    { goalId: goal1._id, userId: user._id, amount: 25000, note: 'Bonus transfer', contributedAt: new Date('2024-12-31') },
    { goalId: goal1._id, userId: user._id, amount: 80000, note: 'Q1 savings', contributedAt: new Date('2025-02-28') },
    { goalId: goal2._id, userId: user._id, amount: 20000, note: 'Trip fund start', contributedAt: new Date('2024-12-15') },
    { goalId: goal2._id, userId: user._id, amount: 32000, note: 'Extra freelance income', contributedAt: new Date('2025-02-01') },
  ]);

  // Recurring
  await RecurringTransaction.insertMany([
    { userId: user._id, type: 'income', amount: 150000, categoryId: catMap['Salary'], accountId: hdfc, description: 'Monthly Salary', frequency: 'monthly', nextDueDate: new Date('2025-04-01'), isActive: true },
    { userId: user._id, type: 'expense', amount: 799, categoryId: catMap['Subscriptions'], accountId: icici, description: 'Netflix Subscription', frequency: 'monthly', nextDueDate: new Date('2025-04-05'), isActive: true },
  ]);

  console.log('\n✅ Seed complete!');
  console.log('📧 Demo login: demo@finvault.app');
  console.log('🔑 Password:   Demo@1234\n');
  mongoose.disconnect();
};

seed().catch(err => { console.error(err); process.exit(1); });
