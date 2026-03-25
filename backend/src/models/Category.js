const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [40, 'Name cannot exceed 40 characters'],
  },
  type: {
    type: String,
    required: true,
    enum: ['income', 'expense'],
  },
  color: {
    type: String,
    default: '#1A56DB',
    match: [/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'],
  },
  icon: {
    type: String,
    default: '📦',
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

categorySchema.index({ userId: 1, type: 1 });
categorySchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);
