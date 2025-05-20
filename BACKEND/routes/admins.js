const router = require('express').Router();
const Admin = require('../models/admin');

// Register new admin
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ username });
        if (existingAdmin) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        // Create new admin
        const newAdmin = new Admin({
            username,
            password
        });

        // Save admin
        const savedAdmin = await newAdmin.save();
        res.status(201).json(savedAdmin);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Login admin
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if admin exists and password matches
        const admin = await Admin.findOne({ username, password });
        if (!admin) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        res.status(200).json({
            admin: {
                id: admin._id,
                username: admin.username
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get admin profile
router.get('/profile', async (req, res) => {
    try {
        const admin = await Admin.findById(req.query.id).select('-password');
        res.json(admin);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 