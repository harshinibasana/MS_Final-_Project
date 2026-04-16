const mongoose = require('mongoose');

const PackingItemSchema = new mongoose.Schema({
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  category: {
    type: String,
    enum: ['clothing', 'toiletries', 'electronics', 'documents', 'medicine', 'accessories', 'other'],
    default: 'other',
  },
  packed: { type: Boolean, default: false },
  quantity: { type: Number, default: 1 },
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('PackingItem', PackingItemSchema);
