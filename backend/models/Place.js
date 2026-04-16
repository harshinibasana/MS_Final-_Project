const mongoose = require('mongoose');

const PlaceSchema = new mongoose.Schema({
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  address: { type: String, default: '' },
  category: {
    type: String,
    enum: ['restaurant', 'hotel', 'attraction', 'museum', 'beach', 'park', 'shopping', 'nightlife', 'other'],
    default: 'attraction',
  },
  rating: { type: Number, min: 1, max: 5, default: null },
  notes: { type: String, default: '' },
  website: { type: String, default: '' },
  visited: { type: Boolean, default: false },
  image: { type: String, default: '' },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number },
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Place', PlaceSchema);
