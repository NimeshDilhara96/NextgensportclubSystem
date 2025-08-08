const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');

// Get all payments (admin)
router.get('/', async (req, res) => {
  try {
    const payments = await Payment.find().sort({ date: -1 });
    res.json({ status: 'success', payments });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Get payments by user email
router.get('/user/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const payments = await Payment.find({ userEmail: email }).sort({ date: -1 });
    res.json({ status: 'success', payments });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Create a new payment record
router.post('/create', async (req, res) => {
  try {
    const { userEmail, planName, amount, paymentId, status, type } = req.body;
    
    const payment = new Payment({
      userEmail,
      planName,
      amount,
      paymentId,
      status: status || 'success',
      type: type || 'membership'
    });

    await payment.save();
    res.status(201).json({ status: 'success', payment });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Update payment status
router.put('/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { status } = req.body;
    
    const payment = await Payment.findOneAndUpdate(
      { paymentId },
      { status },
      { new: true }
    );
    
    if (!payment) {
      return res.status(404).json({ status: 'error', message: 'Payment not found' });
    }
    
    res.json({ status: 'success', payment });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;