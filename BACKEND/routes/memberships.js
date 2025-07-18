const express = require('express');
const router = express.Router();
const Membership = require('../models/Membership');
const User = require('../models/User');
const Payment = require('../models/Payment'); // Add this at the top

// Get all membership plans
router.get('/', async (req, res) => {
  try {
    const memberships = await Membership.find();
    res.json({ status: 'success', memberships });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Add a new membership plan (admin only)
router.post('/', async (req, res) => {
  try {
    const { name, price, period, features, recommended } = req.body;
    const membership = new Membership({ name, price, period, features, recommended });
    await membership.save();
    res.status(201).json({ status: 'success', membership });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Update a membership plan (admin only)
router.put('/:id', async (req, res) => {
  try {
    const membership = await Membership.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!membership) return res.status(404).json({ status: 'error', message: 'Membership not found' });
    res.json({ status: 'success', membership });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Delete a membership plan (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const membership = await Membership.findByIdAndDelete(req.params.id);
    if (!membership) return res.status(404).json({ status: 'error', message: 'Membership not found' });
    res.json({ status: 'success', message: 'Membership deleted' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// User purchases/upgrades membership
router.post('/purchase', async (req, res) => {
  try {
    const { userEmail, membershipName } = req.body;
    const user = await User.findOne({ email: userEmail });
    if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });
    const membership = await Membership.findOne({ name: membershipName });
    if (!membership) return res.status(404).json({ status: 'error', message: 'Membership plan not found' });

    // Set membership duration
    const now = new Date();
    let end;
    if (membershipName.toLowerCase() === "big") {
      end = new Date(now);
      end.setMonth(end.getMonth() + 1); // 1 month
    } else if (membershipName.toLowerCase() === "premium") {
      end = new Date(now);
      end.setFullYear(end.getFullYear() + 1); // 1 year
    } else {
      end = null;
    }

    user.membershipPackage = membership.name.toLowerCase();
    user.membershipStatus = 'active';
    user.membershipStart = now;
    user.membershipEnd = end;
    await user.save();

    await Payment.create({
      userEmail,
      planName: membership.name,
      amount: membership.price,
      paymentId: req.body.paymentId || 'FAKE_PAYMENT_ID_' + Math.floor(Math.random() * 100000),
      status: 'success',
      type: 'membership' // <-- Set type
    });

    res.json({
      status: 'success',
      message: 'Membership updated',
      user: {
        membershipPackage: user.membershipPackage,
        membershipStatus: user.membershipStatus,
        membershipStart: user.membershipStart,
        membershipEnd: user.membershipEnd
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Seed default membership plans (for setup/demo)
router.post('/seed-plans', async (req, res) => {
  try {
    const existing = await Membership.find();
    if (existing.length > 0) {
      return res.status(400).json({ status: 'error', message: 'Plans already exist' });
    }
    const plans = [
      {
        name: 'Light',
        price: 29.99,
        period: '/month',
        features: [
          'Access to basic gym equipment',
          '2 group classes per month',
          'Basic fitness tracking',
          'Locker room access',
          'Standard support'
        ],
        recommended: false
      },
      {
        name: 'Big',
        price: 49.99,
        period: '/month',
        features: [
          'Full gym access',
          'Unlimited group classes',
          'Advanced fitness tracking',
          'Personal locker',
          'Priority support',
          '1 personal training session/month',
          'Nutrition consultation'
        ],
        recommended: true
      },
      {
        name: 'Premium',
        price: 89.99,
        period: '/month',
        features: [
          '24/7 gym access',
          'Unlimited group classes',
          'Premium fitness tracking',
          'Luxury locker room',
          'VIP support',
          '4 personal training sessions/month',
          'Monthly nutrition plan',
          'Spa access',
          'Guest passes'
        ],
        recommended: false
      }
    ];
    await Membership.insertMany(plans);
    res.json({ status: 'success', message: 'Default plans seeded', plans });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Example function to downgrade expired memberships
const downgradeExpiredMemberships = async () => {
  const now = new Date();
  await User.updateMany(
    { membershipEnd: { $lt: now }, membershipStatus: 'active' },
    {
      $set: {
        membershipPackage: 'free',
        membershipStatus: 'inactive',
        membershipStart: null,
        membershipEnd: null
      }
    }
  );
};

module.exports = router;

