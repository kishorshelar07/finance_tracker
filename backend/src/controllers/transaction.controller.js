const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const AppError = require('../utils/AppError');
const { asyncHandler, success, paginated, getPeriodRange } = require('../utils/helpers');

// ─── Build filter from query params ──────────────────
const buildFilter = (query, userId) => {
  const filter = { userId };

  if (query.type && query.type !== 'all') filter.type = query.type;
  if (query.categoryId) filter.categoryId = query.categoryId;
  if (query.accountId) filter.accountId = query.accountId;

  // Period
  if (query.period && query.period !== 'all') {
    const { start, end } = getPeriodRange(query.period);
    filter.date = { $gte: start, $lte: end };
  }
  if (query.startDate && query.endDate) {
    filter.date = {
      $gte: new Date(query.startDate),
      $lte: new Date(query.endDate + 'T23:59:59'),
    };
  }

  // Amount range
  if (query.minAmount || query.maxAmount) {
    filter.amount = {};
    if (query.minAmount) filter.amount.$gte = parseFloat(query.minAmount);
    if (query.maxAmount) filter.amount.$lte = parseFloat(query.maxAmount);
  }

  // Search
  if (query.search) {
    filter.$or = [
      { description: { $regex: query.search, $options: 'i' } },
      { referenceNumber: { $regex: query.search, $options: 'i' } },
    ];
  }

  return filter;
};

// GET /transactions
exports.getTransactions = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;

  const filter = buildFilter(req.query, req.user._id);

  const [transactions, total] = await Promise.all([
    Transaction.find(filter)
      .populate('categoryId', 'name icon color type')
      .populate('accountId', 'name type icon color')
      .populate('toAccountId', 'name type icon')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Transaction.countDocuments(filter),
  ]);

  // Summary for current filter
  const summary = await Transaction.aggregate([
    { $match: filter },
    { $group: {
      _id: '$type',
      total: { $sum: '$amount' },
      count: { $sum: 1 },
    }},
  ]);

  const summaryMap = { income: 0, expense: 0, transfer: 0 };
  summary.forEach(s => { summaryMap[s._id] = s.total; });

  paginated(res, { transactions, summary: summaryMap }, total, page, limit);
});

// POST /transactions
exports.createTransaction = asyncHandler(async (req, res, next) => {
  const { type, amount, categoryId, accountId, description, date, referenceNumber, isRecurring, notes } = req.body;

  const account = await Account.findOne({ _id: accountId, userId: req.user._id });
  if (!account) return next(new AppError('Account not found.', 404));

  // Update account balance
  const parsedAmount = parseFloat(parseFloat(amount).toFixed(2));
  if (type === 'income') {
    account.balance = parseFloat((account.balance + parsedAmount).toFixed(2));
  } else if (type === 'expense') {
    account.balance = parseFloat((account.balance - parsedAmount).toFixed(2));
  }

  const receiptUrl = req.file ? `/uploads/${req.file.filename}` : null;

  const [transaction] = await Promise.all([
    Transaction.create({
      userId: req.user._id,
      type, amount: parsedAmount,
      categoryId: categoryId || null,
      accountId, description, notes,
      date: date ? new Date(date) : new Date(),
      referenceNumber, isRecurring: isRecurring || false,
      receiptUrl,
    }),
    account.save(),
  ]);

  const populated = await transaction.populate([
    { path: 'categoryId', select: 'name icon color' },
    { path: 'accountId', select: 'name type icon' },
  ]);

  success(res, { transaction: populated }, 'Transaction created.', 201);
});

// GET /transactions/:id
exports.getTransaction = asyncHandler(async (req, res, next) => {
  const tx = await Transaction.findOne({ _id: req.params.id, userId: req.user._id })
    .populate('categoryId', 'name icon color')
    .populate('accountId', 'name type icon');
  if (!tx) return next(new AppError('Transaction not found.', 404));
  success(res, { transaction: tx });
});

// PUT /transactions/:id
exports.updateTransaction = asyncHandler(async (req, res, next) => {
  const tx = await Transaction.findOne({ _id: req.params.id, userId: req.user._id });
  if (!tx) return next(new AppError('Transaction not found.', 404));

  const oldAmount = tx.amount;
  const oldType = tx.type;

  const { amount, categoryId, accountId, description, date, referenceNumber, notes } = req.body;

  // Reverse old balance impact
  const account = await Account.findById(tx.accountId);
  if (account) {
    if (oldType === 'income') account.balance -= oldAmount;
    else if (oldType === 'expense') account.balance += oldAmount;
  }

  // Apply new amount
  const newAmount = amount ? parseFloat(parseFloat(amount).toFixed(2)) : oldAmount;
  const newType = req.body.type || oldType;

  if (account) {
    if (newType === 'income') account.balance += newAmount;
    else if (newType === 'expense') account.balance -= newAmount;
    account.balance = parseFloat(account.balance.toFixed(2));
    await account.save();
  }

  Object.assign(tx, {
    amount: newAmount,
    type: newType,
    categoryId: categoryId || tx.categoryId,
    accountId: accountId || tx.accountId,
    description: description !== undefined ? description : tx.description,
    date: date ? new Date(date) : tx.date,
    referenceNumber: referenceNumber !== undefined ? referenceNumber : tx.referenceNumber,
    notes: notes !== undefined ? notes : tx.notes,
  });

  await tx.save();
  const populated = await tx.populate([
    { path: 'categoryId', select: 'name icon color' },
    { path: 'accountId', select: 'name type icon' },
  ]);

  success(res, { transaction: populated }, 'Transaction updated.');
});

// DELETE /transactions/:id
exports.deleteTransaction = asyncHandler(async (req, res, next) => {
  const tx = await Transaction.findOne({ _id: req.params.id, userId: req.user._id });
  if (!tx) return next(new AppError('Transaction not found.', 404));

  // Reverse balance
  const account = await Account.findById(tx.accountId);
  if (account) {
    if (tx.type === 'income') account.balance -= tx.amount;
    else if (tx.type === 'expense') account.balance += tx.amount;
    account.balance = parseFloat(account.balance.toFixed(2));
    await account.save();
  }

  await tx.deleteOne();
  success(res, null, 'Transaction deleted.');
});

// POST /transactions/bulk-delete
exports.bulkDelete = asyncHandler(async (req, res, next) => {
  const { ids } = req.body;
  if (!ids || !ids.length) return next(new AppError('No transaction IDs provided.', 400));

  const txs = await Transaction.find({ _id: { $in: ids }, userId: req.user._id });

  // Reverse balances
  for (const tx of txs) {
    const account = await Account.findById(tx.accountId);
    if (account) {
      if (tx.type === 'income') account.balance -= tx.amount;
      else if (tx.type === 'expense') account.balance += tx.amount;
      account.balance = parseFloat(account.balance.toFixed(2));
      await account.save();
    }
  }

  await Transaction.deleteMany({ _id: { $in: ids }, userId: req.user._id });
  success(res, null, `${txs.length} transactions deleted.`);
});

// GET /transactions/export
exports.exportTransactions = asyncHandler(async (req, res, next) => {
  const { format = 'csv' } = req.query;
  const filter = buildFilter(req.query, req.user._id);

  const transactions = await Transaction.find(filter)
    .populate('categoryId', 'name')
    .populate('accountId', 'name')
    .sort({ date: -1 })
    .limit(5000)
    .lean();

  if (format === 'csv') {
    const rows = [
      ['Date', 'Type', 'Category', 'Account', 'Description', 'Amount', 'Reference'],
      ...transactions.map(t => [
        new Date(t.date).toLocaleDateString('en-IN'),
        t.type,
        t.categoryId?.name || '',
        t.accountId?.name || '',
        t.description || '',
        t.amount,
        t.referenceNumber || '',
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
    return res.send(csv);
  }

  if (format === 'xlsx') {
    const ExcelJS = require('exceljs');
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Transactions');
    ws.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Type', key: 'type', width: 12 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Account', key: 'account', width: 20 },
      { header: 'Description', key: 'description', width: 30 },
      { header: 'Amount (₹)', key: 'amount', width: 15 },
      { header: 'Reference', key: 'reference', width: 20 },
    ];
    ws.getRow(1).font = { bold: true };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A56DB' } };
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    transactions.forEach(t => {
      ws.addRow({
        date: new Date(t.date).toLocaleDateString('en-IN'),
        type: t.type,
        category: t.categoryId?.name || '',
        account: t.accountId?.name || '',
        description: t.description || '',
        amount: t.amount,
        reference: t.referenceNumber || '',
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions.xlsx"');
    return wb.xlsx.write(res);
  }

  next(new AppError('Invalid export format. Use csv or xlsx.', 400));
});

// POST /transactions/import-csv
exports.importCSV = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new AppError('Please upload a CSV file.', 400));

  const content = req.file.buffer.toString('utf-8');
  const lines = content.split('\n').filter(Boolean);
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());

  const results = { valid: [], invalid: [], errors: [] };

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
    const row = {};
    headers.forEach((h, idx) => { row[h] = values[idx] || ''; });

    const errors = [];
    if (!row.date || isNaN(Date.parse(row.date))) errors.push('Invalid date');
    if (!row.type || !['income', 'expense', 'transfer'].includes(row.type.toLowerCase())) errors.push('Invalid type');
    if (!row.amount || isNaN(parseFloat(row.amount))) errors.push('Invalid amount');

    if (errors.length) {
      results.invalid.push({ row: i, data: row, errors });
    } else {
      results.valid.push({ ...row, rowNum: i });
    }
  }

  success(res, {
    preview: results.valid.slice(0, 5),
    validCount: results.valid.length,
    invalidCount: results.invalid.length,
    errors: results.invalid,
    sessionData: results.valid,
  }, `Parsed: ${results.valid.length} valid, ${results.invalid.length} invalid rows.`);
});
