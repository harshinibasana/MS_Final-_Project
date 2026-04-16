const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true },
  password:  { type: String, required: true, minlength: 6, select: false },
  avatar:    { type: String, default: '' },
  role:      { type: String, enum: ['user','admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now },
});

// Only hash on new create — NOT on findByIdAndUpdate (raw $set bypasses this)
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  // Don't double-hash if already a bcrypt hash
  if (this.password && this.password.startsWith('$2')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

UserSchema.methods.generateToken = function () {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

module.exports = mongoose.model('User', UserSchema);
