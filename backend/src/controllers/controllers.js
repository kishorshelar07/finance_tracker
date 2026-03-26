const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const { Budget, BudgetAlert, SavingsGoal, SavingsContribution, RecurringTransaction } = require('../models/models');
const AppError = require('../utils/AppError');
const { asyncHandler, success, paginated, getPeriodRange, getMonthRange } = require('../utils/helpers');

// ══════════════════════════════════════════════════════
// CATEGORIES
// ══════════════════════════════════════════════════════
exports.getCategories = asyncHandler(async (req, res) => {
  const filter = { userId: req.user._id };
  if (req.query.type) filter.type = req.query.type;
  const categories = await Category.find(filter).sort({ isDefault: -1, name: 1 });
  success(res, { categories });
});

exports.createCategory = asyncHandler(async (req, res, next) => {
  const { name, type, color, icon } = req.body;
  const exists = await Category.findOne({ userId: req.user._id, name: { $regex: new RegExp(`^${name}$`, 'i') } });
  if (exists) return next(new AppError('Category with this name already exists.', 409));
  const category = await Category.create({ userId: req.user._id, name, type, color, icon });
  success(res, { category }, 'Category created.', 201);
});

exports.updateCategory = asyncHandler(async (req, res, next) => {
  const cat = await Category.findOne({ _id: req.params.id, userId: req.user._id });
  if (!cat) return next(new AppError('Category not found.', 404));
  Object.assign(cat, req.body);
  await cat.save();
  success(res, { category: cat }, 'Category updated.');
});

exports.deleteCategory = asyncHandler(async (req, res, next) => {
  const cat = await Category.findOne({ _id: req.params.id, userId: req.user._id });
  if (!cat) return next(new AppError('Category not found.', 404));
  if (cat.isDefault) return next(new AppError('Cannot delete default categories.', 400));
  const txCount = await Transaction.countDocuments({ categoryId: req.params.id });
  if (txCount > 0) return next(new AppError(`Category has ${txCount} transactions. Cannot delete.`, 400));
  await cat.deleteOne();
  success(res, null, 'Category deleted.');
});

// ══════════════════════════════════════════════════════
// BUDGETS
// ══════════════════════════════════════════════════════
exports.getBudgets = asyncHandler(async (req, res) => {
  const budgets = await Budget.find({ userId: req.user._id })
    .populate('categoryId', 'name icon color');

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // BUG FIX: In aggregation pipelines, always cast to mongoose.Types.ObjectId.
  // req.user._id is already an ObjectId from Mongoose, but being explicit prevents
  // any edge-case string comparison issues in the $match stage.
  const mongoose = require('mongoose');
  const userId = new mongoose.Types.ObjectId(req.user._id);

  const enriched = await Promise.all(budgets.map(async (b) => {
    const categoryObjectId = new mongoose.Types.ObjectId(b.categoryId._id);

    const spent = await Transaction.aggregate([
      {
        $match: {
          userId,
          categoryId: categoryObjectId,
          type: 'expense',
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const spentAmount = spent[0]?.total || 0;
    const pct = Math.min((spentAmount / b.amountLimit) * 100, 999);

    // Days left in current month
    const daysInMonth = endOfMonth.getDate();
    const todayDate   = now.getDate();
    const daysLeft    = Math.max(0, daysInMonth - todayDate);

    return {
      ...b.toObject(),
      spentAmount:  parseFloat(spentAmount.toFixed(2)),
      remaining:    parseFloat((b.amountLimit - spentAmount).toFixed(2)),
      percentUsed:  parseFloat(pct.toFixed(1)),
      isOverBudget: spentAmount > b.amountLimit,
      daysLeft,
    };
  }));

  success(res, { budgets: enriched });
});

exports.createBudget = asyncHandler(async (req, res, next) => {
  const { categoryId, amountLimit, period } = req.body;
  const exists = await Budget.findOne({ userId: req.user._id, categoryId });
  if (exists) return next(new AppError('Budget for this category already exists.', 409));
  const budget = await Budget.create({ userId: req.user._id, categoryId, amountLimit, period });
  success(res, { budget }, 'Budget created.', 201);
});

exports.updateBudget = asyncHandler(async (req, res, next) => {
  const budget = await Budget.findOne({ _id: req.params.id, userId: req.user._id });
  if (!budget) return next(new AppError('Budget not found.', 404));
  Object.assign(budget, req.body);
  await budget.save();
  success(res, { budget }, 'Budget updated.');
});

exports.deleteBudget = asyncHandler(async (req, res, next) => {
  const budget = await Budget.findOne({ _id: req.params.id, userId: req.user._id });
  if (!budget) return next(new AppError('Budget not found.', 404));
  await budget.deleteOne();
  success(res, null, 'Budget deleted.');
});

// ══════════════════════════════════════════════════════
// SAVINGS GOALS
// ══════════════════════════════════════════════════════
exports.getGoals = asyncHandler(async (req, res) => {
  const goals = await SavingsGoal.find({ userId: req.user._id }).sort({ createdAt: -1 });
  success(res, { goals });
});

exports.createGoal = asyncHandler(async (req, res) => {
  const { name, targetAmount, deadline, icon, color } = req.body;
  const goal = await SavingsGoal.create({ userId: req.user._id, name, targetAmount, deadline, icon, color });
  success(res, { goal }, 'Savings goal created.', 201);
});

exports.updateGoal = asyncHandler(async (req, res, next) => {
  const goal = await SavingsGoal.findOne({ _id: req.params.id, userId: req.user._id });
  if (!goal) return next(new AppError('Goal not found.', 404));
  Object.assign(goal, req.body);
  await goal.save();
  success(res, { goal }, 'Goal updated.');
});

exports.deleteGoal = asyncHandler(async (req, res, next) => {
  const goal = await SavingsGoal.findOne({ _id: req.params.id, userId: req.user._id });
  if (!goal) return next(new AppError('Goal not found.', 404));
  await Promise.all([goal.deleteOne(), SavingsContribution.deleteMany({ goalId: goal._id })]);
  success(res, null, 'Goal deleted.');
});

exports.addContribution = asyncHandler(async (req, res, next) => {
  const goal = await SavingsGoal.findOne({ _id: req.params.id, userId: req.user._id });
  if (!goal) return next(new AppError('Goal not found.', 404));
  if (goal.status !== 'active') return next(new AppError('Goal is not active.', 400));

  const { amount, note } = req.body;
  const parsedAmount = parseFloat(amount);
  if (!parsedAmount || parsedAmount <= 0) return next(new AppError('Invalid amount.', 400));

  goal.currentAmount = parseFloat(Math.min(goal.currentAmount + parsedAmount, goal.targetAmount).toFixed(2));
  if (goal.currentAmount >= goal.targetAmount) goal.status = 'completed';
  await goal.save();

  const contribution = await SavingsContribution.create({ goalId: goal._id, userId: req.user._id, amount: parsedAmount, note });
  success(res, { goal, contribution }, 'Contribution added.');
});

exports.getContributions = asyncHandler(async (req, res, next) => {
  const goal = await SavingsGoal.findOne({ _id: req.params.id, userId: req.user._id });
  if (!goal) return next(new AppError('Goal not found.', 404));
  const contributions = await SavingsContribution.find({ goalId: goal._id }).sort({ contributedAt: -1 });
  success(res, { goal, contributions });
});

// ══════════════════════════════════════════════════════
// RECURRING TRANSACTIONS
// ══════════════════════════════════════════════════════
exports.getRecurring = asyncHandler(async (req, res) => {
  const recurring = await RecurringTransaction.find({ userId: req.user._id })
    .populate('categoryId', 'name icon color')
    .populate('accountId', 'name type')
    .sort({ nextDueDate: 1 });
  success(res, { recurring });
});

exports.createRecurring = asyncHandler(async (req, res) => {
  const r = await RecurringTransaction.create({ ...req.body, userId: req.user._id });
  success(res, { recurring: r }, 'Recurring entry created.', 201);
});

exports.updateRecurring = asyncHandler(async (req, res, next) => {
  const r = await RecurringTransaction.findOne({ _id: req.params.id, userId: req.user._id });
  if (!r) return next(new AppError('Recurring entry not found.', 404));
  Object.assign(r, req.body);
  await r.save();
  success(res, { recurring: r }, 'Updated.');
});

exports.deleteRecurring = asyncHandler(async (req, res, next) => {
  const r = await RecurringTransaction.findOne({ _id: req.params.id, userId: req.user._id });
  if (!r) return next(new AppError('Recurring entry not found.', 404));
  await r.deleteOne();
  success(res, null, 'Recurring entry deleted.');
});

exports.pauseRecurring = asyncHandler(async (req, res, next) => {
  const r = await RecurringTransaction.findOne({ _id: req.params.id, userId: req.user._id });
  if (!r) return next(new AppError('Not found.', 404));
  r.isActive = false;
  await r.save();
  success(res, { recurring: r }, 'Paused.');
});

exports.resumeRecurring = asyncHandler(async (req, res, next) => {
  const r = await RecurringTransaction.findOne({ _id: req.params.id, userId: req.user._id });
  if (!r) return next(new AppError('Not found.', 404));
  r.isActive = true;
  await r.save();
  success(res, { recurring: r }, 'Resumed.');
});

// ══════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const mongoose = require('mongoose');
  const userId = new mongoose.Types.ObjectId(req.user._id);

  const { start: thisStart, end: thisEnd } = getPeriodRange(req.query.period || 'this_month');
  const { start: lastStart, end: lastEnd } = (() => {
    const d = new Date(thisStart);
    d.setMonth(d.getMonth() - 1);
    return getMonthRange(d.getFullYear(), d.getMonth() + 1);
  })();

  const [accounts, thisMonthAgg, lastMonthAgg] = await Promise.all([
    Account.find({ userId: req.user._id, isActive: true }),
    Transaction.aggregate([
      { $match: { userId, date: { $gte: thisStart, $lte: thisEnd } } },
      { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Transaction.aggregate([
      { $match: { userId, date: { $gte: lastStart, $lte: lastEnd } } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]),
  ]);

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const buildMap = (agg) => {
    const m = { income: 0, expense: 0, transfer: 0 };
    agg.forEach(a => { m[a._id] = a.total; });
    return m;
  };

  const thisMth = buildMap(thisMonthAgg);
  const lastMth = buildMap(lastMonthAgg);
  const savings = thisMth.income - thisMth.expense;
  const savingsRate = thisMth.income > 0 ? ((savings / thisMth.income) * 100) : 0;

  const pctChange = (curr, prev) =>
    prev > 0 ? parseFloat(((curr - prev) / prev * 100).toFixed(1)) : null;

  success(res, {
    totalBalance: parseFloat(totalBalance.toFixed(2)),
    income:       parseFloat(thisMth.income.toFixed(2)),
    expense:      parseFloat(thisMth.expense.toFixed(2)),
    savings:      parseFloat(savings.toFixed(2)),
    savingsRate:  parseFloat(savingsRate.toFixed(1)),
    changes: {
      income:  pctChange(thisMth.income, lastMth.income),
      expense: pctChange(thisMth.expense, lastMth.expense),
      savings: pctChange(savings, lastMth.income - lastMth.expense),
    },
  });
});

exports.getIncomeExpenseChart = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const months = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    months.push({
      label: d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
      start, end,
    });
  }

  const data = await Promise.all(months.map(async (m) => {
    const agg = await Transaction.aggregate([
      { $match: { userId, date: { $gte: m.start, $lte: m.end }, type: { $in: ['income', 'expense'] } } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]);
    const map = { income: 0, expense: 0 };
    agg.forEach(a => { map[a._id] = parseFloat(a.total.toFixed(2)); });
    return { ...m, ...map };
  }));

  success(res, { data });
});

exports.getCategoryBreakdown = asyncHandler(async (req, res) => {
  const { start, end } = getPeriodRange(req.query.period || 'this_month');
  const data = await Transaction.aggregate([
    { $match: { userId: req.user._id, type: 'expense', date: { $gte: start, $lte: end } } },
    { $group: { _id: '$categoryId', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
    { $unwind: { path: '$category', preserveNullAndEmpty: true } },
    { $project: { name: { $ifNull: ['$category.name', 'Uncategorized'] }, icon: '$category.icon', color: '$category.color', total: 1, count: 1 } },
    { $sort: { total: -1 } },
  ]);
  success(res, { data });
});

exports.getCashFlow = asyncHandler(async (req, res) => {
  const { start, end } = getPeriodRange(req.query.period || 'this_month');
  const txs = await Transaction.find({
    userId: req.user._id,
    date: { $gte: start, $lte: end },
    type: { $in: ['income', 'expense'] },
  }).sort({ date: 1 }).select('date type amount');

  let balance = 0;
  const daily = {};
  txs.forEach(t => {
    const key = new Date(t.date).toISOString().slice(0, 10);
    if (!daily[key]) daily[key] = 0;
    daily[key] += t.type === 'income' ? t.amount : -t.amount;
  });

  const data = Object.entries(daily).map(([date, net]) => {
    balance += net;
    return { date, net: parseFloat(net.toFixed(2)), balance: parseFloat(balance.toFixed(2)) };
  });

  success(res, { data });
});

exports.getSavingsTrend = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const user = req.user;
  const now = new Date();
  const data = [];

  for (let i = 11; i >= 0; i--) {
    const { start, end } = getMonthRange(
      new Date(now.getFullYear(), now.getMonth() - i).getFullYear(),
      new Date(now.getFullYear(), now.getMonth() - i).getMonth() + 1
    );
    const agg = await Transaction.aggregate([
      { $match: { userId, date: { $gte: start, $lte: end }, type: { $in: ['income', 'expense'] } } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]);
    const map = { income: 0, expense: 0 };
    agg.forEach(a => { map[a._id] = a.total; });
    const savings = map.income - map.expense;
    data.push({
      label: start.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
      savings: parseFloat(savings.toFixed(2)),
      goal: user.monthlyIncome * (user.savingsGoalPercent / 100),
    });
  }

  success(res, { data });
});

exports.getAccountsChart = asyncHandler(async (req, res) => {
  const accounts = await Account.find({ userId: req.user._id, isActive: true });
  success(res, {
    data: accounts.map(a => ({
      name: a.name,
      balance: a.balance,
      color: a.color,
      type: a.type,
    })),
  });
});

// ══════════════════════════════════════════════════════
// REPORTS
// ══════════════════════════════════════════════════════
exports.getMonthlyReport = asyncHandler(async (req, res) => {
  const month = parseInt(req.query.month) || new Date().getMonth() + 1;
  const year = parseInt(req.query.year) || new Date().getFullYear();
  const { start, end } = getMonthRange(year, month);
  const userId = req.user._id;

  const [txAgg, catBreakdown, accounts, budgets] = await Promise.all([
    Transaction.aggregate([
      { $match: { userId, date: { $gte: start, $lte: end } } },
      { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Transaction.aggregate([
      { $match: { userId, date: { $gte: start, $lte: end }, type: 'expense' } },
      { $group: { _id: '$categoryId', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'cat' } },
      { $unwind: { path: '$cat', preserveNullAndEmpty: true } },
      { $project: { name: { $ifNull: ['$cat.name', 'Uncategorized'] }, icon: '$cat.icon', color: '$cat.color', total: 1, count: 1 } },
      { $sort: { total: -1 } },
    ]),
    Account.find({ userId }),
    Budget.find({ userId }).populate('categoryId', 'name icon'),
  ]);

  const map = { income: 0, expense: 0 };
  txAgg.forEach(a => { map[a._id] = a.total; });
  const savings = map.income - map.expense;

  const top5Expenses = await Transaction.find({ userId, date: { $gte: start, $lte: end }, type: 'expense' })
    .populate('categoryId', 'name icon')
    .sort({ amount: -1 })
    .limit(5);

  success(res, {
    period: { month, year, start, end },
    summary: {
      income: parseFloat(map.income.toFixed(2)),
      expense: parseFloat(map.expense.toFixed(2)),
      savings: parseFloat(savings.toFixed(2)),
      savingsRate: map.income > 0 ? parseFloat(((savings / map.income) * 100).toFixed(1)) : 0,
    },
    categoryBreakdown: catBreakdown.map(c => ({
      ...c,
      percentOfTotal: map.expense > 0 ? parseFloat(((c.total / map.expense) * 100).toFixed(1)) : 0,
    })),
    top5Expenses,
    accounts,
  });
});
