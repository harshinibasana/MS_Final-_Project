const mongoose = require('mongoose');

const TripSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  destination: { type: String, required: true },
  country: { type: String, default: '' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['planning', 'active', 'completed', 'cancelled'], default: 'planning' },
  coverImage: { type: String, default: '' },
  coverImagePublicId: { type: String, default: '' },
  notes: { type: String, default: '' },
  totalBudget: { type: Number, default: 0 },
  currency: { type: String, default: 'USD' },
  travelers: { type: Number, default: 1 },
  tags: [{ type: String }],
  color: { type: String, default: '#0A4D6E' },
  shareToken: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

TripSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

TripSchema.virtual('duration').get(function () {
  const diff = this.endDate - this.startDate;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

TripSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Trip', TripSchema);
