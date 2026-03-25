const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { asyncHandler } = require('../utils/helpers');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Get token from Authorization header
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Access denied. Please log in.', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return next(new AppError('User no longer exists.', 401));
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Access token expired. Please refresh.', 401));
    }
    return next(new AppError('Invalid access token.', 401));
  }
});

// Only verified users
const requireVerified = asyncHandler(async (req, res, next) => {
  if (!req.user.isVerified) {
    return next(new AppError('Please verify your email address first.', 403));
  }
  next();
});

module.exports = { protect, requireVerified };
