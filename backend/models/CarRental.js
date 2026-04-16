const mongoose = require('mongoose');

const CarRentalSchema = new mongoose.Schema({
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company: { type: String, required: true },
  carModel: { type: String, required: true },
  carType: {
    type: String,
    enum: ['economy', 'compact', 'midsize', 'fullsize', 'suv', 'luxury', 'convertible', 'van'],
    default: 'economy',
  },
  pickupLocation: { type: String, required: true },
  dropoffLocation: { type: String, default: '' },
  pickupDate: { type: Date, required: true },
  dropoffDate: { type: Date, required: true },
  pricePerDay: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  confirmationNumber: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'confirmed', 'active', 'completed', 'cancelled'], default: 'pending' },
  notes: { type: String, default: '' },
  insurance: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('CarRental', CarRentalSchema);
