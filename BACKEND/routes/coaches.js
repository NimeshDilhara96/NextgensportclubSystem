const express = require('express');
const router = express.Router();
const Coach = require('../models/Coach');
const Sport = require('../models/Sport');
const User = require('../models/User'); // Import User model
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
        const fileTypes = /jpeg|jpg|png|gif|webp/;
        const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = fileTypes.test(file.mimetype);
        
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed!'));
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

// Get coach by email with sports and members
router.get('/by-email/:email/details', async (req, res) => {
    try {
        const coach = await Coach.findOne({ email: req.params.email }, { password: 0 })
            .populate({
                path: 'sports',
                select: 'name members',
            });

        if (!coach) {
            return res.status(404).json({
                success: false,
                message: 'Coach not found'
            });
        }

        const sportsDetails = coach.sports.map(sport => ({
            sportId: sport._id,
            sportName: sport.name,
            members: sport.members
        }));

        res.status(200).json({
            success: true,
            coach: {
                _id: coach._id,
                name: coach.name,
                specialty: coach.specialty,
                sports: sportsDetails
            }
        });
    } catch (error) {
        console.error('Error fetching coach details by email:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch coach details',
            error: error.message
        });
    }
});

// Get coach by ID with sports and members
router.get('/:id/details', async (req, res) => {
    try {
        const coach = await Coach.findById(req.params.id, { password: 0 })
            .populate({
                path: 'sports',
                select: 'name members',
            });

        if (!coach) {
            return res.status(404).json({
                success: false,
                message: 'Coach not found'
            });
        }

        // Format response: show sport name and members for each sport
        const sportsDetails = coach.sports.map(sport => ({
            sportId: sport._id,
            sportName: sport.name,
            members: sport.members
        }));

        res.status(200).json({
            success: true,
            coach: {
                _id: coach._id,
                name: coach.name,
                specialty: coach.specialty,
                sports: sportsDetails
            }
        });
    } catch (error) {
        console.error('Error fetching coach details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch coach details',
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
            email,
            phone,
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
        
        if (email) coach.email = email;
        if (phone) coach.phone = phone;
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
            email: coach.email,
            phone: coach.phone
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

// Update booking route to use email
router.post('/book/by-email/:coachEmail', async (req, res) => {
    try {
        const { userEmail, date, time, notes } = req.body;
        
        // Find coach by email
        const coach = await Coach.findOne({ email: req.params.coachEmail });
        if (!coach) {
            return res.status(404).json({
                success: false,
                message: 'Coach not found'
            });
        }

        // Find user by email
        const user = await User.findOne({ email: userEmail });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Create new session
        const newSession = {
            userName: user.name,
            userEmail: user.email,
            date,
            time,
            notes,
            status: 'pending'
        };

        // Add session to coach's sessions array
        coach.sessions.push(newSession);
        await coach.save();

        res.status(200).json({
            success: true,
            message: 'Session booked successfully',
            session: newSession
        });

    } catch (error) {
        console.error('Booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to book session',
            error: error.message
        });
    }
});

// Add route to get sessions
router.get('/sessions/:coachEmail', async (req, res) => {
    try {
        const coach = await Coach.findOne({ email: req.params.coachEmail });
        if (!coach) {
            return res.status(404).json({
                success: false,
                message: 'Coach not found'
            });
        }

        // Sort sessions by date, most recent first
        const sortedSessions = coach.sessions.sort((a, b) => b.createdAt - a.createdAt);

        res.status(200).json({
            success: true,
            sessions: sortedSessions
        });
    } catch (error) {
        console.error('Error fetching sessions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch sessions',
            error: error.message
        });
    }
});

// Add this route to update session status
router.patch('/sessions/:sessionId/status', async (req, res) => {
    try {
        const { status } = req.body;
        const coach = await Coach.findOne({ 'sessions._id': req.params.sessionId });
        
        if (!coach) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }

        const session = coach.sessions.id(req.params.sessionId);
        session.status = status;
        await coach.save();

        res.status(200).json({
            success: true,
            message: 'Session status updated successfully'
        });
    } catch (error) {
        console.error('Error updating session status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update session status',
            error: error.message
        });
    }
});

router.use('/training-plans', trainingPlansRouter);

module.exports = router;