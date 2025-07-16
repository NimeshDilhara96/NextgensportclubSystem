const router = require('express').Router();
const Sport = require('../models/Sport');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const TrainingPlan = require('../models/TrainingPlan');
const Coach = require('../models/Coach');

// Configure multer for image upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/sports/');  // Make sure this directory exists
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb('Error: Only images are allowed!');
        }
    }
});

// Create new sport
router.post('/create', upload.single('image'), async (req, res) => {
    try {
        const { name, description, category, schedule, instructorName, maxCapacity, availability } = req.body;
        
        // Process uploaded image
        const imagePath = req.file ? `uploads/sports/${req.file.filename}` : '';

        const newSport = new Sport({
            name,
            description,
            category,
            schedule,
            instructorName,
            maxCapacity: maxCapacity || 20,
            availability: availability || 'Available',
            image: imagePath,
            memberCount: 0,
            members: []
        });

        const savedSport = await newSport.save();
        res.status(201).json({
            status: 'success',
            sport: savedSport
        });
    } catch (error) {
        console.error('Error creating sport:', error);
        res.status(500).json({ 
            status: 'error',
            message: 'Failed to create sport'
        });
    }
});

// Get all sports
router.get('/', async (req, res) => {
    try {
        const sports = await Sport.find().populate('coaches');
        res.status(200).json({
            status: 'success',
            sports
        });
    } catch (error) {
        console.error('Error fetching sports:', error);
        res.status(500).json({ 
            status: 'error',
            message: 'Failed to fetch sports'
        });
    }
});

// Get sport by ID
router.get('/:sportId', async (req, res) => {
    try {
        const sport = await Sport.findById(req.params.sportId);
        if (!sport) {
            return res.status(404).json({
                status: 'error',
                message: 'Sport not found'
            });
        }
        res.status(200).json({
            status: 'success',
            sport
        });
    } catch (error) {
        console.error('Error fetching sport:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch sport'
        });
    }
});

// Join a sport
router.post('/join/:sportId', async (req, res) => {
    try {
        const sportId = req.params.sportId;
        
        // Get user email from the session/authentication token
        // This assumes your authentication middleware adds user to req object
        const userEmail = req.user?.email || req.body.email;
        
        if (!userEmail) {
            return res.status(401).json({
                status: 'error',
                message: 'Authentication required - please login first'
            });
        }

        // Find both sport and user documents using the email from session
        const sport = await Sport.findById(sportId);
        const User = require('../models/User');
        const user = await User.findOne({ email: userEmail });

        if (!sport) {
            return res.status(404).json({
                status: 'error',
                message: 'Sport not found'
            });
        }

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User profile not found - please register or login again'
            });
        }

        // Check if user is already a member of this sport
        const existingMember = sport.members.find(member => member.userEmail === userEmail);
        if (existingMember) {
            return res.status(400).json({
                status: 'error',
                message: 'You are already a member of this sport'
            });
        }

        // Check if sport is already in user's sports array
        const existingSport = user.sports?.find(item => item.sport.toString() === sportId);
        if (existingSport) {
            return res.status(400).json({
                status: 'error',
                message: 'This sport is already in your profile'
            });
        }

        // Check if at max capacity
        if (sport.memberCount >= sport.maxCapacity) {
            return res.status(400).json({
                status: 'error',
                message: 'This sport has reached maximum capacity'
            });
        }

        // Add member to sport and increment count
        sport.members.push({
            userId: user._id,
            userName: user.name,
            userEmail: user.email,
            joinedAt: new Date(),
            status: 'active'
        });
        sport.memberCount = sport.memberCount + 1;
        await sport.save(); // Only save the sport

        // Do NOT update user.preferredSports or user.sports here

        // --- Create a default training plan for the user joining this sport ---
        // Find a coach for this sport (by specialty)
        let coach = await Coach.findOne({ specialty: sport.name, isActive: true });
        // If no coach with exact specialty, just get any active coach
        if (!coach) coach = await Coach.findOne({ isActive: true });

        // Create a default training plan
        const plan = new TrainingPlan({
            user: user._id,
            sport: sport._id,
            coach: coach ? coach._id : null,
            title: `Starter Plan for ${sport.name}`,
            description: `Welcome to ${sport.name}! This is your starter training plan.`,
            sessions: []
        });
        await plan.save();
        // --- End training plan creation ---
        
        res.status(200).json({
            status: 'success',
            message: 'Successfully joined the sport',
            sport: sport,
            user: {
                name: user.name,
                email: user.email,
                sports: user.sports
            },
            trainingPlan: plan
        });
    } catch (error) {
        console.error('Error joining sport:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to join sport'
        });
    }
});

// Leave a sport
router.post('/leave/:sportId', async (req, res) => {
    try {
        const sportId = req.params.sportId;
        const userEmail = req.body.userEmail || req.user?.email;
        
        if (!userEmail) {
            return res.status(400).json({
                status: 'error',
                message: 'User email required'
            });
        }

        // Find both sport and user documents
        const sport = await Sport.findById(sportId);
        const User = require('../models/User');
        const user = await User.findOne({ email: userEmail });

        if (!sport) {
            return res.status(404).json({
                status: 'error',
                message: 'Sport not found'
            });
        }

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        // Check if user is a member of sport (by email)
        const memberIndex = sport.members.findIndex(member => member.userEmail === userEmail);
        if (memberIndex === -1) {
            return res.status(400).json({
                status: 'error',
                message: 'You are not a member of this sport'
            });
        }

        // Check if sport exists in user's sports array
        const sportIndex = user.sports.findIndex(item => item.sport.toString() === sportId);
        if (sportIndex === -1) {
            return res.status(400).json({
                status: 'error',
                message: 'Sport not found in user profile'
            });
        }

        // Remove member from sport and decrement count
        sport.members.splice(memberIndex, 1);
        sport.memberCount = Math.max(0, sport.memberCount - 1);

        // Remove sport from user's sports array
        user.sports.splice(sportIndex, 1);

        // Save both documents
        const [updatedSport, updatedUser] = await Promise.all([
            sport.save(),
            user.save()
        ]);
        
        res.status(200).json({
            status: 'success',
            message: 'Successfully left the sport',
            sport: updatedSport,
            user: {
                name: updatedUser.name,
                email: updatedUser.email,
                sports: updatedUser.sports
            }
        });
    } catch (error) {
        console.error('Error leaving sport:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to leave sport'
        });
    }
});

// Update member status
router.patch('/:sportId/member/:userEmail', async (req, res) => {
    try {
        const { sportId, userEmail } = req.params;
        const { status } = req.body;
        
        if (!status || !['active', 'inactive', 'pending'].includes(status)) {
            return res.status(400).json({
                status: 'error',
                message: 'Valid status required (active, inactive, or pending)'
            });
        }

        const sport = await Sport.findById(sportId);
        if (!sport) {
            return res.status(404).json({
                status: 'error',
                message: 'Sport not found'
            });
        }

        // Find the member by email
        const memberIndex = sport.members.findIndex(member => member.userEmail === userEmail);
        if (memberIndex === -1) {
            return res.status(404).json({
                status: 'error',
                message: 'Member not found'
            });
        }

        // Update member status
        sport.members[memberIndex].status = status;
        
        // If status is inactive, also update member count
        if (status === 'inactive' && sport.members[memberIndex].status === 'active') {
            sport.memberCount = Math.max(0, sport.memberCount - 1);
        } else if (status === 'active' && sport.members[memberIndex].status !== 'active') {
            sport.memberCount = sport.memberCount + 1;
        }

        await sport.save();
        
        res.status(200).json({
            status: 'success',
            message: `Member status updated to ${status}`,
            member: sport.members[memberIndex]
        });
    } catch (error) {
        console.error('Error updating member status:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update member status'
        });
    }
});

// Update sport
router.put('/:sportId', upload.single('image'), async (req, res) => {
    try {
        const { name, description, category, schedule, instructorName, maxCapacity, availability } = req.body;
        const sportId = req.params.sportId;

        const sport = await Sport.findById(sportId);
        if (!sport) {
            return res.status(404).json({
                status: 'error',
                message: 'Sport not found'
            });
        }

        // Process uploaded image if exists
        let imagePath = sport.image;
        if (req.file) {
            // Delete old image if exists and not a default
            if (sport.image && !sport.image.includes('placeholder') && fs.existsSync(path.join(__dirname, '..', sport.image))) {
                fs.unlinkSync(path.join(__dirname, '..', sport.image));
            }
            imagePath = `uploads/sports/${req.file.filename}`;
        }

        const updatedSport = await Sport.findByIdAndUpdate(
            sportId,
            {
                name: name || sport.name,
                description: description || sport.description,
                category: category || sport.category,
                schedule: schedule || sport.schedule,
                instructorName: instructorName || sport.instructorName,
                maxCapacity: maxCapacity || sport.maxCapacity,
                availability: availability || sport.availability,
                image: imagePath
            },
            { new: true }
        );

        res.status(200).json({
            status: 'success',
            sport: updatedSport
        });
    } catch (error) {
        console.error('Error updating sport:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update sport'
        });
    }
});

// Get users table for a specific sport with detailed information
router.get('/:sportId/users-table', async (req, res) => {
    try {
        const sportId = req.params.sportId;
        
        // First get the sport to verify it exists
        const sport = await Sport.findById(sportId);
        if (!sport) {
            return res.status(404).json({
                status: 'error',
                message: 'Sport not found'
            });
        }
        
        // Get all users who are members of this sport with detailed profile information
        const User = require('../models/User');
        const users = await User.find({
            "sports.sport": sportId
        }).select('name email contact gender age profilePicture sports');
        
        // Extract the sport-specific information for each user
        const usersWithSportDetails = users.map(user => {
            const sportEntry = user.sports.find(s => s.sport.toString() === sportId);
            return {
                userId: user._id,
                name: user.name,
                email: user.email,
                contact: user.contact,
                gender: user.gender,
                age: user.age,
                profilePicture: user.profilePicture,
                sportSpecific: {
                    joinedAt: sportEntry?.joinedAt,
                    role: sportEntry?.role,
                    status: sportEntry?.status
                }
            };
        });
        
        res.status(200).json({
            status: 'success',
            sportName: sport.name,
            sportCategory: sport.category,
            totalMembers: usersWithSportDetails.length,
            users: usersWithSportDetails
        });
    } catch (error) {
        console.error('Error fetching sport users table:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch sport users table',
            error: error.message
        });
    }
});

// Delete sport
router.delete('/:sportId', async (req, res) => {
    try {
        const sport = await Sport.findById(req.params.sportId);
        if (!sport) {
            return res.status(404).json({
                status: 'error',
                message: 'Sport not found'
            });
        }

        // Delete associated image if exists and not a placeholder
        if (sport.image && !sport.image.includes('placeholder') && fs.existsSync(path.join(__dirname, '..', sport.image))) {
            fs.unlinkSync(path.join(__dirname, '..', sport.image));
        }

        // Remove this sport from all users' sports arrays
        const User = require('../models/User');
        await User.updateMany(
            {},
            { $pull: { sports: { sport: sport._id } } }
        );

        await Sport.findByIdAndDelete(req.params.sportId);
        res.status(200).json({
            status: 'success',
            message: 'Sport deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting sport:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to delete sport'
        });
    }
});

// Get members of a sport
router.get('/:sportId/members', async (req, res) => {
    try {
        const sport = await Sport.findById(req.params.sportId);
        if (!sport) {
            return res.status(404).json({
                status: 'error',
                message: 'Sport not found'
            });
        }
        res.status(200).json({
            status: 'success',
            members: sport.members
        });
    } catch (error) {
        console.error('Error fetching members:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch members'
        });
    }
});

// Get all sports for a specific user
router.get('/user/:userId', async (req, res) => {
    try {
        const User = require('../models/User');
        const user = await User.findById(req.params.userId).populate('sports.sport');
        
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }
        
        res.status(200).json({
            status: 'success',
            sports: user.sports
        });
    } catch (error) {
        console.error('Error fetching user sports:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch user sports'
        });
    }
});

module.exports = router;