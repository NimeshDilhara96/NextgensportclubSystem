const express = require('express');
const router = express.Router();
const Facility = require('../models/Facility');
const User = require('../models/User');
const Sport = require('../models/Sport');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for image upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Create directory if it doesn't exist
        const dir = 'uploads/facilities/';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
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

// Get all facilities
// Public access
router.get('/', async (req, res) => {
    try {
        const facilities = await Facility.find()
            .select('name description image hours availability location')
            .sort({ name: 1 });
        
        return res.status(200).json({
            status: "success",
            count: facilities.length,
            facilities
        });
    } catch (error) {
        console.error('Error fetching facilities:', error);
        return res.status(500).json({
            status: "error",
            message: "Server error while fetching facilities"
        });
    }
});

// Get facility details by ID
// Public access
router.get('/:id', async (req, res) => {
    try {
        const facility = await Facility.findById(req.params.id)
            .populate('sportTypes', 'name');

        if (!facility) {
            return res.status(404).json({
                status: "error",
                message: "Facility not found"
            });
        }

        return res.status(200).json({
            status: "success",
            facility
        });
    } catch (error) {
        console.error('Error fetching facility details:', error);
        return res.status(500).json({
            status: "error",
            message: "Server error while fetching facility details"
        });
    }
});

// Create a new facility
// Admin access only
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const { name, description, hours, availability, capacity, location } = req.body;
        
        // Process uploaded image
        const imagePath = req.file ? `uploads/facilities/${req.file.filename}` : '';
        
        // Convert amenities and rules from string to array if provided
        const amenities = req.body.amenities ? req.body.amenities.split(',').map(item => item.trim()) : [];
        const rules = req.body.rules ? req.body.rules.split(',').map(item => item.trim()) : [];
        
        // Convert sportTypes from string to array of ObjectIds if provided
        const sportTypes = req.body.sportTypes ? req.body.sportTypes.split(',').map(id => new mongoose.Types.ObjectId(id.trim())) : [];

        const newFacility = new Facility({
            name,
            description,
            image: imagePath,
            hours,
            availability: availability || 'Available',
            capacity: capacity || 0,
            location: location || 'Main Building',
            amenities,
            rules,
            sportTypes
        });

        const savedFacility = await newFacility.save();

        return res.status(201).json({
            status: "success",
            message: "Facility created successfully",
            facility: savedFacility
        });
    } catch (error) {
        console.error('Error creating facility:', error);
        return res.status(500).json({
            status: "error",
            message: "Server error while creating facility"
        });
    }
});

// Update a facility
// Admin access only
router.put('/:id', upload.single('image'), async (req, res) => {
    try {
        const { name, description, hours, availability, capacity, location } = req.body;
        const facilityId = req.params.id;
        
        const facility = await Facility.findById(facilityId);
        if (!facility) {
            return res.status(404).json({
                status: "error",
                message: "Facility not found"
            });
        }
        
        // Process uploaded image if exists
        let imagePath = facility.image;
        if (req.file) {
            // Delete old image if exists and not a default
            if (facility.image && !facility.image.includes('default') && fs.existsSync(path.join(__dirname, '..', facility.image))) {
                fs.unlinkSync(path.join(__dirname, '..', facility.image));
            }
            imagePath = `uploads/facilities/${req.file.filename}`;
        }
        
        // Convert amenities and rules from string to array if provided
        const amenities = req.body.amenities ? req.body.amenities.split(',').map(item => item.trim()) : facility.amenities;
        const rules = req.body.rules ? req.body.rules.split(',').map(item => item.trim()) : facility.rules;
        
        // Convert sportTypes from string to array of ObjectIds if provided
        const sportTypes = req.body.sportTypes ? 
            req.body.sportTypes.split(',').map(id => new mongoose.Types.ObjectId(id.trim())) : 
            facility.sportTypes;

        const updatedFacility = await Facility.findByIdAndUpdate(
            facilityId,
            {
                name: name || facility.name,
                description: description || facility.description,
                hours: hours || facility.hours,
                availability: availability || facility.availability,
                capacity: capacity || facility.capacity,
                location: location || facility.location,
                image: imagePath,
                amenities,
                rules,
                sportTypes
            },
            { new: true }
        );

        return res.status(200).json({
            status: "success",
            message: "Facility updated successfully",
            facility: updatedFacility
        });
    } catch (error) {
        console.error('Error updating facility:', error);
        return res.status(500).json({
            status: "error",
            message: "Server error while updating facility"
        });
    }
});

// Delete a facility
// Admin access only
router.delete('/:id', async (req, res) => {
    try {
        const facility = await Facility.findById(req.params.id);
        if (!facility) {
            return res.status(404).json({
                status: "error",
                message: "Facility not found"
            });
        }
        
        // Delete associated image if exists and not a default
        if (facility.image && !facility.image.includes('default') && fs.existsSync(path.join(__dirname, '..', facility.image))) {
            fs.unlinkSync(path.join(__dirname, '..', facility.image));
        }

        // Remove facility from all sports
        await Sport.updateMany(
            { facilities: new mongoose.Types.ObjectId(req.params.id) },
            { $pull: { facilities: new mongoose.Types.ObjectId(req.params.id) } }
        );

        // Cancel all bookings for this facility
        await User.updateMany(
            { 'bookings.facility': new mongoose.Types.ObjectId(req.params.id) },
            { $set: { 'bookings.$.status': 'cancelled' } }
        );

        await Facility.findByIdAndDelete(req.params.id);

        return res.status(200).json({
            status: "success",
            message: "Facility deleted successfully"
        });
    } catch (error) {
        console.error('Error deleting facility:', error);
        return res.status(500).json({
            status: "error",
            message: "Server error while deleting facility"
        });
    }
});

// Book a facility
// Authenticated users only
router.post('/book/:id', async (req, res) => {
    try {
        const { startTime, endTime, userEmail } = req.body;
        
        if (!startTime || !endTime || !userEmail) {
            return res.status(400).json({
                status: "error",
                message: "Start time, end time, and user email are required"
            });
        }

        const facility = await Facility.findById(req.params.id);
        if (!facility) {
            return res.status(404).json({
                status: "error",
                message: "Facility not found"
            });
        }

        // Check if facility is available
        if (facility.availability !== 'Available') {
            return res.status(400).json({
                status: "error",
                message: `This facility is currently ${facility.availability}`
            });
        }

        // Parse the operating hours
        // Expected format: "9:00 AM - 9:00 PM" or similar
        const bookingStartTime = new Date(startTime);
        const bookingEndTime = new Date(endTime);
        
        // Extract hours from the facility operating hours
        const operatingHours = facility.hours.split('-');
        if (operatingHours.length !== 2) {
            return res.status(400).json({
                status: "error",
                message: "Invalid facility operating hours format"
            });
        }

        // Function to parse time string to Date object
        const parseTimeString = (timeStr, dateRef) => {
            const time = new Date(dateRef);
            const [hourMin, period] = timeStr.trim().split(' ');
            let [hour, minute] = hourMin.split(':').map(num => parseInt(num));
            
            if (period && period.toUpperCase() === 'PM' && hour < 12) {
                hour += 12;
            } else if (period && period.toUpperCase() === 'AM' && hour === 12) {
                hour = 0;
            }
            
            time.setHours(hour, minute, 0, 0);
            return time;
        };

        // Parse facility open and close times for the booking date
        const facilityOpenTime = parseTimeString(operatingHours[0], bookingStartTime);
        const facilityCloseTime = parseTimeString(operatingHours[1], bookingStartTime);

        // Check if booking is within operating hours
        if (bookingStartTime < facilityOpenTime || bookingEndTime > facilityCloseTime) {
            return res.status(400).json({
                status: "error",
                message: `Booking must be within facility operating hours: ${facility.hours}`
            });
        }

        const user = await User.findOne({ email: userEmail });
        if (!user) {
            return res.status(404).json({
                status: "error",
                message: "User not found"
            });
        }

        // Check for overlapping bookings for this user
        const overlappingUserBooking = user.bookings?.find(booking => 
            booking.facility.toString() === req.params.id &&
            new Date(startTime) < new Date(booking.endTime) &&
            new Date(endTime) > new Date(booking.startTime) &&
            booking.status !== 'cancelled'
        );

        if (overlappingUserBooking) {
            return res.status(400).json({
                status: "error",
                message: "You already have a booking for this facility during this time"
            });
        }

        // Check facility capacity - find all active bookings for this time slot
        const allUsers = await User.find({
            'bookings': {
                $elemMatch: {
                    facility: new mongoose.Types.ObjectId(req.params.id),
                    startTime: { $lt: new Date(endTime) },
                    endTime: { $gt: new Date(startTime) },
                    status: 'confirmed'
                }
            }
        });
        
        // Count total bookings for this time slot
        const concurrentBookings = allUsers.reduce((count, user) => {
            const activeBookings = user.bookings.filter(booking => 
                booking.facility.toString() === req.params.id &&
                new Date(startTime) < new Date(booking.endTime) &&
                new Date(endTime) > new Date(booking.startTime) &&
                booking.status === 'confirmed'
            ).length;
            return count + activeBookings;
        }, 0);

        // Check if adding one more booking exceeds capacity
        if (concurrentBookings >= facility.capacity) {
            return res.status(400).json({
                status: "error",
                message: "This facility is already at full capacity for the requested time slot"
            });
        }

        // Initialize bookings array if it doesn't exist
        if (!user.bookings) {
            user.bookings = [];
        }

        // Add booking
        user.bookings.push({
            facility: req.params.id,
            facilityName: facility.name,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            status: 'confirmed'
        });

        await user.save();

        return res.status(200).json({
            status: "success",
            message: "Facility booked successfully"
        });
    } catch (error) {
        console.error('Error booking facility:', error);
        return res.status(500).json({
            status: "error",
            message: "Server error while booking facility"
        });
    }
});

module.exports = router;