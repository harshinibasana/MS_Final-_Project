const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'USD' },
  category: {
    type: String,
    enum: ['accommodation', 'transport', 'food', 'activities', 'shopping', 'health', 'visa', 'other'],
    default: 'other',
  },
  date: { type: Date, default: Date.now },
  notes: { type: String, default: '' },
  receipt: { type: String, default: '' },
  receiptPublicId: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Expense', ExpenseSchema);
