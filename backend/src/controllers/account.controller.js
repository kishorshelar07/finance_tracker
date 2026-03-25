const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const AppError = require('../utils/AppError');
const { asyncHandler, success, paginated } = require('../utils/helpers');

// GET /accounts
exports.getAccounts = asyncHandler(async (req, res) => {
  const accounts = await Account.find({ userId: req.user._id }).sort({ createdAt: 1 });
  const totalBalance = accounts.filter(a => a.isActive).reduce((s, a) => s + a.balance, 0);
  success(res, { accounts, totalBalance });
});

// POST /accounts
exports.createAccount = asyncHandler(async (req, res) => {
  const { name, type, balance, currency, color, icon } = req.body;
  const account = await Account.create({
    userId: req.user._id,
    name, type,
    balance: balance || 0,
    openingBalance: balance || 0,
    currency: currency || req.user.currency,
    color: color || '#1A56DB',
    icon: icon || '🏦',
  });
  success(res, { account }, 'Account created.', 201);
});

// PUT /accounts/:id
exports.updateAccount = asyncHandler(async (req, res, next) => {
  const account = await Account.findOne({ _id: req.params.id, userId: req.user._id });
  if (!account) return next(new AppError('Account not found.', 404));

  const { name, type, color, icon } = req.body;
  Object.assign(account, { name, type, color, icon });
  await account.save();

  success(res, { account }, 'Account updated.');
});

// DELETE /accounts/:id
exports.deleteAccount = asyncHandler(async (req, res, next) => {
  const account = await Account.findOne({ _id: req.params.id, userId: req.user._id });
  if (!account) return next(new AppError('Account not found.', 404));

  const txCount = await Transaction.countDocuments({ accountId: req.params.id });
  if (txCount > 0) {
    return next(new AppError(
      `Cannot delete: this account has ${txCount} transaction(s). Archive it instead.`, 400
    ));
  }

  await account.deleteOne();
  success(res, null, 'Account deleted.');
});

// PATCH /accounts/:id/archive
exports.toggleArchive = asyncHandler(async (req, res, next) => {
  const account = await Account.findOne({ _id: req.params.id, userId: req.user._id });
  if (!account) return next(new AppError('Account not found.', 404));
  account.isActive = !account.isActive;
  await account.save();
  success(res, { account }, `Account ${account.isActive ? 'restored' : 'archived'}.`);
});

// POST /accounts/transfer
exports.transfer = asyncHandler(async (req, res, next) => {
  const { fromAccountId, toAccountId, amount, description, date } = req.body;
  if (!fromAccountId || !toAccountId || !amount) {
    return next(new AppError('fromAccountId, toAccountId and amount are required.', 400));
  }
  if (fromAccountId === toAccountId) {
    return next(new AppError('Cannot transfer to the same account.', 400));
  }

  const [fromAcc, toAcc] = await Promise.all([
    Account.findOne({ _id: fromAccountId, userId: req.user._id }),
    Account.findOne({ _id: toAccountId, userId: req.user._id }),
  ]);

  if (!fromAcc || !toAcc) return next(new AppError('One or both accounts not found.', 404));

  fromAcc.balance = parseFloat((fromAcc.balance - amount).toFixed(2));
  toAcc.balance = parseFloat((toAcc.balance + amount).toFixed(2));

  const txDate = date ? new Date(date) : new Date();

  const [tx] = await Promise.all([
    Transaction.create({
      userId: req.user._id,
      type: 'transfer',
      amount,
      accountId: fromAccountId,
      toAccountId,
      description: description || `Transfer to ${toAcc.name}`,
      date: txDate,
    }),
    fromAcc.save(),
    toAcc.save(),
  ]);

  success(res, { transaction: tx, fromAccount: fromAcc, toAccount: toAcc }, 'Transfer completed.');
});

// GET /accounts/:id/transactions
exports.getAccountTransactions = asyncHandler(async (req, res, next) => {
  const account = await Account.findOne({ _id: req.params.id, userId: req.user._id });
  if (!account) return next(new AppError('Account not found.', 404));

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const filter = {
    userId: req.user._id,
    $or: [{ accountId: req.params.id }, { toAccountId: req.params.id }],
  };

  const [transactions, total] = await Promise.all([
    Transaction.find(filter)
      .populate('categoryId', 'name icon color')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit),
    Transaction.countDocuments(filter),
  ]);

  paginated(res, transactions, total, page, limit);
});
