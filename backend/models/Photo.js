const mongoose = require('mongoose');

const PhotoSchema = new mongoose.Schema({
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  caption: { type: String, default: '' },
  location: { type: String, default: '' },
  takenAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Photo', PhotoSchema);
