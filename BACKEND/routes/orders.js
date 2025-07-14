const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const mongoose = require('mongoose');

// Create a new order
router.post('/', async (req, res) => {
  try {
    let { userId, products, total, address, phone, email } = req.body;
    console.log('ORDER BODY:', req.body);
    if ((!userId && !email) || !products || !address || !phone || !email) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ success: false, message: 'Products must be a non-empty array' });
    }
    if (typeof total !== 'number' || isNaN(total)) {
      return res.status(400).json({ success: false, message: 'Total must be a valid number' });
    }

    // Find user by userId or email
    let user = null;
    if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ success: false, message: 'Invalid userId' });
      }
      user = await User.findById(userId);
    }
    if (!user && email) {
      user = await User.findOne({ email });
      if (user) userId = user._id;
    }
    console.log('RESOLVED USER:', user);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Validate products
    for (const item of products) {
      if (!item.product || !mongoose.Types.ObjectId.isValid(item.product)) {
        return res.status(400).json({ success: false, message: `Invalid product ID: ${item.product}` });
      }
      const product = await Product.findById(item.product);
      console.log('PRODUCT LOOKUP:', item.product, '=>', product);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product not found: ${item.product}` });
      }
      if (typeof item.quantity !== 'number' || item.quantity < 1) {
        return res.status(400).json({ success: false, message: `Invalid quantity for product: ${item.product}` });
      }
    }

    const order = new Order({
      user: userId,
      products,
      total,
      address,
      phone,
      email
    });
    const savedOrder = await order.save();
    res.status(201).json({ success: true, order: savedOrder });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, message: 'Failed to create order', error: error.message });
  }
});

// Get all orders (admin)
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email contact')
      .populate('products.product', 'name price');
    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch orders', error: error.message });
  }
});

// Update order status and notify user
router.put('/:id/status', async (req, res) => {
  try {
    console.log('UPDATE ORDER STATUS:', req.params, req.body);
    const { status } = req.body;
    const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      console.log('Invalid status:', status);
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const order = await Order.findById(req.params.id);
    if (!order) {
      console.log('Order not found:', req.params.id);
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    order.status = status;
    await order.save();

    res.json({ success: true, order });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, message: 'Failed to update order status', error: error.message });
  }
});

module.exports = router; 