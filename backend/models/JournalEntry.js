const mongoose = require('mongoose');
const JournalSchema = new mongoose.Schema({
  trip:    { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date:    { type: Date, required: true },
  title:   { type: String, default: '' },
  content: { type: String, required: true },
  mood:    { type: String, enum: ['amazing','happy','neutral','tired','tough'], default: 'happy' },
  weather: { type: String, default: '' },
  location:{ type: String, default: '' },
  photos:  [{ type: String }],
  tags:    [{ type: String }],
  isPrivate: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model('JournalEntry', JournalSchema);
