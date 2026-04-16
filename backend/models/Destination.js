const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: { type: String },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

const DestinationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  country: { type: String, required: true },
  city: { type: String, default: '' },
  description: { type: String, default: '' },
  category: {
    type: String,
    enum: ['landmark', 'museum', 'beach', 'mountain', 'park', 'temple', 'castle', 'market', 'restaurant', 'nightlife', 'adventure', 'cultural', 'other'],
    default: 'landmark',
  },
  images: [{ type: String }],
  coverImage: { type: String, default: '' },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number },
  },
  entryFee: {
    adult: { type: Number, default: 0 },
    child: { type: Number, default: 0 },
    senior: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    isFree: { type: Boolean, default: false },
    notes: { type: String, default: '' },
  },
  openingHours: {
    monday: { open: String, close: String, closed: Boolean },
    tuesday: { open: String, close: String, closed: Boolean },
    wednesday: { open: String, close: String, closed: Boolean },
    thursday: { open: String, close: String, closed: Boolean },
    friday: { open: String, close: String, closed: Boolean },
    saturday: { open: String, close: String, closed: Boolean },
    sunday: { open: String, close: String, closed: Boolean },
  },
  website: { type: String, default: '' },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  tags: [{ type: String }],
  reviews: [ReviewSchema],
  averageRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  visitDuration: { type: String, default: '' }, // e.g. "2-3 hours"
  bestTimeToVisit: { type: String, default: '' },
  tips: [{ type: String }],
  isVerified: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Auto-calculate average rating
DestinationSchema.methods.updateRating = function () {
  if (this.reviews.length === 0) { this.averageRating = 0; this.totalReviews = 0; return; }
  this.totalReviews = this.reviews.length;
  this.averageRating = this.reviews.reduce((sum, r) => sum + r.rating, 0) / this.reviews.length;
};

// Text search index
DestinationSchema.index({ name: 'text', country: 'text', city: 'text', description: 'text', tags: 'text' });
DestinationSchema.index({ 'coordinates.lat': 1, 'coordinates.lng': 1 });

module.exports = mongoose.model('Destination', DestinationSchema);
