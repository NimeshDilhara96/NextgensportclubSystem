const express = require('express');
const router = express.Router();
const TrainingPlan = require('../models/TrainingPlan');

// Create a new training plan
router.post('/create', async (req, res) => {
    try {
        const { user, sport, coach, title, description, sessions } = req.body;
        const plan = new TrainingPlan({ user, sport, coach, title, description, sessions });
        await plan.save();
        res.status(201).json({ success: true, plan });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create training plan', error: error.message });
    }
});

// Get all training plans for a user (optionally filter by sport)
router.get('/user/:userId', async (req, res) => {
    try {
        const { sport } = req.query;
        const filter = { user: req.params.userId };
        if (sport) filter.sport = sport;
        const plans = await TrainingPlan.find(filter).populate('sport coach');
        res.json({ success: true, plans });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch training plans', error: error.message });
    }
});

// Get all training plans for a sport
router.get('/sport/:sportId', async (req, res) => {
    try {
        const plans = await TrainingPlan.find({ sport: req.params.sportId }).populate('user coach');
        res.json({ success: true, plans });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch training plans', error: error.message });
    }
});

// Get a training plan by ID
router.get('/:id', async (req, res) => {
    try {
        const plan = await TrainingPlan.findById(req.params.id).populate('user sport coach');
        if (!plan) return res.status(404).json({ success: false, message: 'Training plan not found' });
        res.json({ success: true, plan });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch training plan', error: error.message });
    }
});

// Update a training plan
router.put('/:id', async (req, res) => {
    try {
        const plan = await TrainingPlan.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!plan) return res.status(404).json({ success: false, message: 'Training plan not found' });
        res.json({ success: true, plan });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update training plan', error: error.message });
    }
});

// Delete a training plan
router.delete('/:id', async (req, res) => {
    try {
        const plan = await TrainingPlan.findByIdAndDelete(req.params.id);
        if (!plan) return res.status(404).json({ success: false, message: 'Training plan not found' });
        res.json({ success: true, message: 'Training plan deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete training plan', error: error.message });
    }
});

module.exports = router; 