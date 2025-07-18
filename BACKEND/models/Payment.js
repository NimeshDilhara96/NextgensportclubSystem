const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  planName: { type: String, required: true },
  amount: { type: Number, required: true },
  paymentId: { type: String, required: true }, // e.g. FAKE_PAYMENT_ID_12345
  status: { type: String, default: 'success' }, // or 'failed'
  type: { type: String, enum: ['membership', 'store'], required: true }, // <-- Add this line
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', PaymentSchema);