const mongoose = require('mongoose');

const TripPlanSchema = new mongoose.Schema({
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  category: {
    type: String,
    enum: ['activity','accommodation','transport','food','sightseeing','shopping','document','other'],
    default: 'activity',
  },
  status: { type: String, enum: ['active','completed'], default: 'active' },
  date: { type: Date },
  time: { type: String, default: '' },
  location: { type: String, default: '' },
  notes: { type: String, default: '' },
  priority: { type: String, enum: ['low','medium','high'], default: 'medium' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('TripPlan', TripPlanSchema);
