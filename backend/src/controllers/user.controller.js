const User = require('../models/User');
const AppError = require('../utils/AppError');
const { asyncHandler, success } = require('../utils/helpers');
const { RefreshToken } = require('../models/models');
const path = require('path');
const fs = require('fs');

// GET /user/profile
exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  success(res, { user });
});

// PUT /user/profile
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const { name, email, monthlyIncome, savingsGoalPercent, currency } = req.body;

  // Email uniqueness check
  if (email && email !== req.user.email) {
    const exists = await User.findOne({ email, _id: { $ne: req.user._id } });
    if (exists) return next(new AppError('Email already in use.', 409));
  }

  const updated = await User.findByIdAndUpdate(
    req.user._id,
    { name, email, monthlyIncome, savingsGoalPercent, currency },
    { new: true, runValidators: true }
  );

  success(res, { user: updated }, 'Profile updated.');
});

// PUT /user/password
exports.changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    return next(new AppError('Current password is incorrect.', 400));
  }

  user.password = newPassword;
  await user.save();

  // Revoke all refresh tokens for security
  await RefreshToken.updateMany({ userId: user._id }, { isRevoked: true });
  res.clearCookie('refreshToken', { path: '/' });

  success(res, null, 'Password changed. Please log in again.');
});

// POST /user/profile/picture
exports.uploadPicture = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new AppError('No file uploaded.', 400));

  // Delete old picture
  const user = await User.findById(req.user._id);
  if (user.profilePicture) {
    const oldPath = path.join(__dirname, '../../uploads', path.basename(user.profilePicture));
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  const pictureUrl = `/uploads/${req.file.filename}`;
  await User.findByIdAndUpdate(req.user._id, { profilePicture: pictureUrl });

  success(res, { profilePicture: pictureUrl }, 'Profile picture updated.');
});

// DELETE /user/account
exports.deleteAccount = asyncHandler(async (req, res, next) => {
  const { confirmation } = req.body;
  if (confirmation !== 'DELETE') {
    return next(new AppError('Please type DELETE to confirm account deletion.', 400));
  }

  const userId = req.user._id;

  // Cascade delete all user data
  const Transaction = require('../models/Transaction');
  const Account = require('../models/Account');
  const Category = require('../models/Category');
  const { Budget, SavingsGoal, SavingsContribution, RecurringTransaction } = require('../models/models');

  await Promise.all([
    Transaction.deleteMany({ userId }),
    Account.deleteMany({ userId }),
    Category.deleteMany({ userId }),
    Budget.deleteMany({ userId }),
    SavingsGoal.deleteMany({ userId }),
    SavingsContribution.deleteMany({ userId: userId }),
    RecurringTransaction.deleteMany({ userId }),
    RefreshToken.deleteMany({ userId }),
    User.findByIdAndDelete(userId),
  ]);

  res.clearCookie('refreshToken', { path: '/' });
  success(res, null, 'Account deleted successfully.');
});
