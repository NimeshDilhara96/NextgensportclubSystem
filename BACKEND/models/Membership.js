const mongoose = require('mongoose');

const MembershipSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // e.g. "Big", "Premium"
  price: { type: Number, required: true },
  period: { type: String, default: "/month" },
  features: [String],
  recommended: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Membership', MembershipSchema); 