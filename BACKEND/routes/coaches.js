const express = require('express');
const router = express.Router();
const Coach = require('../models/Coach');
const Sport = require('../models/Sport');
// Replace bcrypt with crypto
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const trainingPlansRouter = require('./trainingPlans');

// Helper functions for password hashing using crypto instead of bcrypt
function generateSalt() {
    return crypto.randomBytes(16).toString('hex');
}

function hashPassword(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads/coaches');
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'coach-' + uniqueSuffix + ext);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|png|gif/;
        const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = fileTypes.test(file.mimetype);
        
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files (jpeg, jpg, png, gif) are allowed!'));
        }
    }
});

// Get all coaches
router.get('/', async (req, res) => {
    try {
        const coaches = await Coach.find({}, { password: 0 }); // Exclude password
        res.status(200).json({
            success: true,
            coaches
        });
    } catch (error) {
        console.error('Error fetching coaches:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch coaches',
            error: error.message
        });
    }
});

// Get coach by ID
router.get('/:id', async (req, res) => {
    try {
        const coach = await Coach.findById(req.params.id, { password: 0 }); // Exclude password
        
        if (!coach) {
            return res.status(404).json({
                success: false,
                message: 'Coach not found'
            });
        }
        
        res.status(200).json({
            success: true,
            coach
        });
    } catch (error) {
        console.error('Error fetching coach:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch coach',
            error: error.message
        });
    }
});

// Create a new coach
router.post('/create', upload.single('image'), async (req, res) => {
    try {
        const { username, password, name, specialty, experience, bio, email, phone, availability, sports } = req.body;
        
        // Check if username already exists
        const existingCoach = await Coach.findOne({ username });
        if (existingCoach) {
            return res.status(400).json({
                success: false,
                message: 'Username already exists'
            });
        }
        
        // Hash password using crypto
        const salt = generateSalt();
        const hashedPassword = hashPassword(password, salt);
        
        // Create new coach
        const newCoach = new Coach({
            username,
            password: `${salt}:${hashedPassword}`, // Store both salt and hash
            name,
            specialty,
            experience,
            bio,
            contact: {
                email,
                phone
            },
            availability: availability ? JSON.parse(availability) : [],
            sports: sports ? JSON.parse(sports) : []
        });
        
        // Add image path if uploaded
        if (req.file) {
            newCoach.image = `/uploads/coaches/${req.file.filename}`;
        }
        
        // Save coach
        const savedCoach = await newCoach.save();
        
        // Bidirectional assignment: add coach to each sport's coaches array
        if (newCoach.sports && newCoach.sports.length > 0) {
            await Sport.updateMany(
                { _id: { $in: newCoach.sports } },
                { $addToSet: { coaches: savedCoach._id } }
            );
        }
        
        // Exclude password from response
        const coachResponse = savedCoach.toObject();
        delete coachResponse.password;
        
        res.status(201).json({
            success: true,
            message: 'Coach created successfully',
            coach: coachResponse
        });
    } catch (error) {
        console.error('Error creating coach:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create coach',
            error: error.message
        });
    }
});

// Update coach
router.put('/:id', upload.single('image'), async (req, res) => {
    try {
        const { name, specialty, experience, bio, email, phone, availability, isActive, sports } = req.body;
        
        // Find coach
        const coach = await Coach.findById(req.params.id);
        if (!coach) {
            return res.status(404).json({
                success: false,
                message: 'Coach not found'
            });
        }
        
        // Update fields
        coach.name = name || coach.name;
        coach.specialty = specialty || coach.specialty;
        coach.experience = experience !== undefined ? experience : coach.experience;
        coach.bio = bio !== undefined ? bio : coach.bio;
        
        if (email || phone) {
            coach.contact = {
                email: email || coach.contact?.email,
                phone: phone || coach.contact?.phone
            };
        }
        
        if (availability) {
            coach.availability = JSON.parse(availability);
        }
        
        if (isActive !== undefined) {
            coach.isActive = isActive;
        }

        if (sports) {
            const newSports = JSON.parse(sports);
            // Remove coach from sports no longer assigned
            const prevSports = coach.sports.map(id => id.toString());
            const toRemove = prevSports.filter(id => !newSports.includes(id));
            if (toRemove.length > 0) {
                await Sport.updateMany(
                    { _id: { $in: toRemove } },
                    { $pull: { coaches: coach._id } }
                );
            }
            // Add coach to new sports
            const toAdd = newSports.filter(id => !prevSports.includes(id));
            if (toAdd.length > 0) {
                await Sport.updateMany(
                    { _id: { $in: toAdd } },
                    { $addToSet: { coaches: coach._id } }
                );
            }
            coach.sports = newSports;
        }
        
        // Update image if uploaded
        if (req.file) {
            // Delete old image if exists
            if (coach.image) {
                const oldImagePath = path.join(__dirname, '..', coach.image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            coach.image = `/uploads/coaches/${req.file.filename}`;
        }
        
        // Save updated coach
        const updatedCoach = await coach.save();
        
        // Exclude password from response
        const coachResponse = updatedCoach.toObject();
        delete coachResponse.password;
        
        res.status(200).json({
            success: true,
            message: 'Coach updated successfully',
            coach: coachResponse
        });
    } catch (error) {
        console.error('Error updating coach:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update coach',
            error: error.message
        });
    }
});

// Delete coach
router.delete('/:id', async (req, res) => {
    try {
        const coach = await Coach.findById(req.params.id);
        
        if (!coach) {
            return res.status(404).json({
                success: false,
                message: 'Coach not found'
            });
        }
        
        // Delete coach image if exists
        if (coach.image) {
            const imagePath = path.join(__dirname, '..', coach.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }
        
        // Delete coach
        await Coach.findByIdAndDelete(req.params.id);
        
        res.status(200).json({
            success: true,
            message: 'Coach deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting coach:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete coach',
            error: error.message
        });
    }
});

// Get coaches by specialty
router.get('/specialty/:specialty', async (req, res) => {
    try {
        const coaches = await Coach.find({ 
            specialty: req.params.specialty,
            isActive: true
        }, { password: 0 });
        
        res.status(200).json({
            success: true,
            coaches
        });
    } catch (error) {
        console.error('Error fetching coaches by specialty:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch coaches',
            error: error.message
        });
    }
});

// Coach login route
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Find coach by username
        const coach = await Coach.findOne({ username });
        
        if (!coach) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }
        
        // Check if coach is active
        if (!coach.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Your account is currently inactive. Please contact administrator.'
            });
        }
        
        // Extract the salt from the stored password (assuming format is "salt:hash")
        const [salt, storedHash] = coach.password.split(':');
        
        // If password isn't in the expected format, use a different verification approach
        let isPasswordValid;
        
        if (storedHash) {
            // If we have a salt:hash format, verify with crypto
            const hash = hashPassword(password, salt);
            isPasswordValid = hash === storedHash;
        } else {
            // Fallback to direct comparison (not recommended for production)
            isPasswordValid = password === coach.password;
        }
        
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { id: coach._id, username: coach.username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        // Return coach data and token (excluding password)
        const coachData = {
            _id: coach._id,
            username: coach.username,
            name: coach.name,
            specialty: coach.specialty,
            experience: coach.experience,
            image: coach.image,
            contact: coach.contact
        };
        
        return res.status(200).json({
            success: true,
            message: 'Login successful',
            coach: coachData,
            token
        });
        
    } catch (error) {
        console.error('Coach login error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred during login'
        });
    }
});

router.use('/training-plans', trainingPlansRouter);

module.exports = router;