const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const Coach = require('../models/Coach');

// POST /messages: Send a message using username/email and roles
router.post('/', async (req, res) => {
    try {
        const { senderValue, senderRole, receiverValue, receiverRole, message } = req.body;
        console.log('POST /messages', { senderValue, senderRole, receiverValue, receiverRole, message });

        // Map lowercase roles to capitalized model names
        const roleToModel = { user: 'User', coach: 'Coach' };
        const senderRoleModel = roleToModel[senderRole] || senderRole;
        const receiverRoleModel = roleToModel[receiverRole] || receiverRole;

        let sender, receiver;

        if (senderRoleModel === 'User') {
            const user = await User.findOne({ email: senderValue });
            if (!user) return res.status(404).json({ success: false, error: 'Sender user not found.' });
            sender = user._id;
        } else {
            // Coach: find by email (new model)
            const coach = await Coach.findOne({ email: senderValue });
            if (!coach) return res.status(404).json({ success: false, error: 'Sender coach not found.' });
            sender = coach._id;
        }

        if (receiverRoleModel === 'User') {
            const user = await User.findOne({ email: receiverValue });
            if (!user) return res.status(404).json({ success: false, error: 'Receiver user not found.' });
            receiver = user._id;
        } else {
            // Coach: find by email (new model)
            const coach = await Coach.findOne({ email: receiverValue });
            if (!coach) return res.status(404).json({ success: false, error: 'Receiver coach not found.' });
            receiver = coach._id;
        }

        const newMsg = new Message({
            sender,
            senderRole: senderRoleModel,
            receiver,
            receiverRole: receiverRoleModel,
            message
        });
        await newMsg.save();
        res.status(201).json({ success: true, message: 'Message sent.' });
    } catch (err) {
        console.error('Message send error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /messages/thread?userValue=...&userRole=...&otherValue=...&otherRole=...
router.get('/thread', async (req, res) => {
    try {
        const { userValue, userRole, otherValue, otherRole } = req.query;
        let user, other;
        // Map lowercase roles to capitalized model names
        const roleToModel = { user: 'User', coach: 'Coach' };
        const userRoleModel = roleToModel[userRole] || userRole;
        const otherRoleModel = roleToModel[otherRole] || otherRole;
        console.log('Thread lookup:', { userValue, userRole, otherValue, otherRole });
        if (userRoleModel === 'User') {
            user = await User.findOne({ email: userValue });
            console.log('User found:', user);
        } else {
            user = await Coach.findOne({ email: userValue });
            console.log('Coach found:', user);
        }
        if (otherRoleModel === 'User') {
            other = await User.findOne({ email: otherValue });
            console.log('Other user found:', other);
        } else {
            other = await Coach.findOne({ email: otherValue });
            console.log('Other coach found:', other);
        }

        if (!user || !other) return res.status(404).json({ messages: [] });

        const messages = await Message.find({
            $or: [
                { sender: user._id, receiver: other._id },
                { sender: other._id, receiver: user._id }
            ]
        })
        .sort({ date: 1 })
        .populate('sender', 'name')
        .lean();

        messages.forEach(msg => {
            msg.senderName = msg.sender?.name || (msg.senderRole === 'Coach' ? 'Coach' : 'You');
        });

        res.json({ messages });
    } catch (err) {
        console.error('Thread error:', err); // <-- Add this
        res.status(500).json({ messages: [] });
    }
});

module.exports = router;