const mongoose = require('mongoose');

const CropSchema = new mongoose.Schema({
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  crop_name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  date_posted: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Crop', CropSchema);
