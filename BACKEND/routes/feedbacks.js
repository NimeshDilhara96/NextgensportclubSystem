const express = require('express');
const router = express.Router();
const Feedback = require('../models/feedback');

// Create feedback
router.post('/', async (req, res) => {
  try {
    const { user, message } = req.body;
    const feedback = new Feedback({ user, message });
    await feedback.save();
    res.status(201).json(feedback);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// View all feedback
router.get('/', async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;