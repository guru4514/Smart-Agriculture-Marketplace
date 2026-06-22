const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  location: { type: String },
  password: { type: String, required: true },
  role: { type: String, enum: ['farmer', 'buyer', 'admin'], required: true },
  date: { type: Date, default: Date.now },
  
  // Email verification
  emailVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  verificationExpires: { type: Date },
  
  // Farmer privacy settings
  allowContactSharing: { type: Boolean, default: true },
  
  // Buyer reputation
  reputation: { type: Number, default: 100, min: 0, max: 100 },
  isBlocked: { type: Boolean, default: false },
  blockReason: { type: String },
  blockedAt: { type: Date },
  
  // Abuse tracking
  reportCount: { type: Number, default: 0 },
  lastReportDate: { type: Date }
});

module.exports = mongoose.model('User', UserSchema);
