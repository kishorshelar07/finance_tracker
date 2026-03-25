const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: [true, 'Account name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters'],
  },
  type: {
    type: String,
    required: true,
    enum: ['cash', 'bank', 'credit_card', 'wallet', 'investment'],
  },
  balance: {
    type: Number,
    default: 0,
    get: v => parseFloat(v.toFixed(2)),
  },
  currency: {
    type: String,
    default: 'INR',
  },
  color: {
    type: String,
    default: '#1A56DB',
    match: [/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'],
  },
  icon: {
    type: String,
    default: '🏦',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  openingBalance: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
  toJSON: { getters: true, virtuals: true },
  toObject: { getters: true },
});

accountSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('Account', accountSchema);
