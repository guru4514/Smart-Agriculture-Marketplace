const mongoose = require('mongoose');

const ContactLogSchema = new mongoose.Schema({
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  viewedAt: { type: Date, default: Date.now },
  ipAddress: { type: String },
  userAgent: { type: String }
});

// Index for finding contact history
ContactLogSchema.index({ buyer: 1, farmer: 1 });
ContactLogSchema.index({ viewedAt: -1 });

module.exports = mongoose.model('ContactLog', ContactLogSchema);
