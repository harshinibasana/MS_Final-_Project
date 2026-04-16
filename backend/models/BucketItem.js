const mongoose = require('mongoose');
const BucketItemSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref:'User', required:true },
  destination: { type: String, required:true },
  country:     { type: String, default:'' },
  category:    { type: String, enum:['adventure','culture','nature','beach','city','food','spiritual','other'], default:'other' },
  notes:       { type: String, default:'' },
  priority:    { type: String, enum:['must','high','someday'], default:'someday' },
  visited:     { type: Boolean, default:false },
  visitedDate: { type: Date },
  coverImage:  { type: String, default:'' },
  lat:         { type: Number },
  lng:         { type: Number },
  createdAt:   { type: Date, default:Date.now },
});
module.exports = mongoose.model('BucketItem', BucketItemSchema);
