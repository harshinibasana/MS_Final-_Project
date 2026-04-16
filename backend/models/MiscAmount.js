const mongoose = require('mongoose');

const MiscAmountSchema = new mongoose.Schema({
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  type: {
    type: String,
    enum: ['tip', 'souvenir', 'emergency', 'laundry', 'communication', 'postage', 'parking', 'toll', 'fee', 'donation', 'other'],
    default: 'other',
  },
  date: { type: Date, default: Date.now },
  location: { type: String, default: '' },
  notes: { type: String, default: '' },
  receiptUrl: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('MiscAmount', MiscAmountSchema);
