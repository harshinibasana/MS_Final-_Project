const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  type: { type: String, enum: ['single', 'double', 'twin', 'suite', 'family', 'deluxe', 'penthouse'], default: 'double' },
  pricePerNight: { type: Number, required: true },
  maxGuests: { type: Number, default: 2 },
  amenities: [{ type: String }],
  description: { type: String, default: '' },
});

const HotelBookingSchema = new mongoose.Schema({
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Property info
  propertyName: { type: String, required: true },
  propertyType: {
    type: String,
    enum: ['hotel', 'motel', 'hostel', 'resort', 'villa', 'apartment', 'bnb', 'guesthouse'],
    default: 'hotel',
  },
  starRating: { type: Number, min: 1, max: 5, default: 3 },
  address: { type: String, required: true },
  city: { type: String, required: true },
  country: { type: String, required: true },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  website: { type: String, default: '' },
  image: { type: String, default: '' },

  // Booking details
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  roomType: {
    type: String,
    enum: ['single', 'double', 'twin', 'suite', 'family', 'deluxe', 'penthouse'],
    default: 'double',
  },
  guests: { type: Number, default: 1 },
  rooms: { type: Number, default: 1 },

  // Pricing
  pricePerNight: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  taxesIncluded: { type: Boolean, default: false },

  // Booking status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled'],
    default: 'pending',
  },
  confirmationNumber: { type: String, default: '' },
  bookingPlatform: { type: String, default: '' }, // e.g. Booking.com, Expedia

  // Amenities
  amenities: [{ type: String }],
  breakfastIncluded: { type: Boolean, default: false },
  parkingIncluded: { type: Boolean, default: false },
  wifiIncluded: { type: Boolean, default: false },
  poolAccess: { type: Boolean, default: false },

  // Notes
  specialRequests: { type: String, default: '' },
  notes: { type: String, default: '' },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

HotelBookingSchema.virtual('nights').get(function () {
  return Math.ceil((this.checkOut - this.checkIn) / (1000 * 60 * 60 * 24));
});

HotelBookingSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('HotelBooking', HotelBookingSchema);
