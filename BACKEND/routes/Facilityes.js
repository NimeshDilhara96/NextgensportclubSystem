const express = require('express');
const router = express.Router();
const Facility = require('../models/Facility');
const User = require('../models/User');
const Sport = require('../models/Sport');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode'); // Add this import

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

// Book a facility with QR code generation and email notification
const axios = require('axios');
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
        const bookingStartTime = new Date(startTime);
        const bookingEndTime = new Date(endTime);

        // Prevent booking in the past
        const now = new Date();
        if (bookingStartTime < now || bookingEndTime < now) {
            return res.status(400).json({
                status: "error",
                message: "Cannot book for a past date or time"
            });
        }

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

        // Check for overlapping bookings for this user in this facility
        const overlappingBooking = facility.bookings.find(booking =>
            booking.user.toString() === user._id.toString() &&
            new Date(startTime) < new Date(booking.endTime) &&
            new Date(endTime) > new Date(booking.startTime) &&
            booking.status !== 'cancelled'
        );

        if (overlappingBooking) {
            return res.status(400).json({
                status: "error",
                message: "You already have a booking for this facility during this time"
            });
        }

        // Check facility capacity - count confirmed bookings for this time slot
        const concurrentBookings = facility.bookings.filter(booking =>
            new Date(startTime) < new Date(booking.endTime) &&
            new Date(endTime) > new Date(booking.startTime) &&
            booking.status === 'confirmed'
        ).length;

        if (concurrentBookings >= facility.capacity) {
            return res.status(400).json({
                status: "error",
                message: "This facility is already at full capacity for the requested time slot"
            });
        }

        // Add booking to facility
        const newBooking = {
            user: user._id,
            userName: user.name,
            startTime: bookingStartTime,
            endTime: bookingEndTime,
            status: 'confirmed'
        };

        facility.bookings.push(newBooking);
        await facility.save();

        // Get the booking ID from the saved booking
        const savedBooking = facility.bookings[facility.bookings.length - 1];
        const bookingId = savedBooking._id;

        // Generate QR code data
        const qrData = {
            bookingId: bookingId.toString(),
            facilityId: facility._id.toString(),
            facilityName: facility.name,
            userName: user.name,
            userEmail: user.email,
            startTime: bookingStartTime.toISOString(),
            endTime: bookingEndTime.toISOString(),
            bookingDate: new Date().toISOString(),
            status: 'confirmed'
        };

        // Create directory for QR codes if it doesn't exist
        const qrCodeDir = path.join(__dirname, '..', 'uploads', 'qrcodes');
        if (!fs.existsSync(qrCodeDir)) {
            fs.mkdirSync(qrCodeDir, { recursive: true });
        }

        // Generate QR code
        const qrCodeFileName = `booking-${bookingId}-${Date.now()}.png`;
        const qrCodePath = path.join(qrCodeDir, qrCodeFileName);
        
        try {
            await QRCode.toFile(qrCodePath, JSON.stringify(qrData), {
                width: 300,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });

            console.log('QR code generated successfully:', qrCodePath);
        } catch (qrError) {
            console.error('Error generating QR code:', qrError);
            // Continue with booking even if QR generation fails
        }

        // Send booking notification email with QR code
        try {
            await axios.post(
                `${process.env.NOTIFICATION_URL || 'http://localhost:8070'}/notify/facility-booking`,
                {
                    email: user.email,
                    name: user.name,
                    facilityName: facility.name,
                    facilityLocation: facility.location,
                    startTime: bookingStartTime,
                    endTime: bookingEndTime,
                    bookingId: bookingId.toString(),
                    qrCodePath: fs.existsSync(qrCodePath) ? qrCodePath : null,
                    bookingDetails: qrData
                }
            );
        } catch (notifyErr) {
            console.error('Error sending booking notification email:', notifyErr?.response?.data || notifyErr.message);
        }

        return res.status(200).json({
            status: "success",
            message: "Facility booked successfully! QR code sent to your email.",
            bookingId: bookingId.toString(),
            qrCodeGenerated: fs.existsSync(qrCodePath)
        });
    } catch (error) {
        console.error('Error booking facility:', error);
        return res.status(500).json({
            status: "error",
            message: "Server error while booking facility"
        });
    }
});

// Get all bookings for a facility (Admin access only)
router.get('/:id/bookings', async (req, res) => {
  try {
    const facilityId = req.params.id;

    // Find the facility and get its bookings
    const facility = await Facility.findById(facilityId).select('bookings name');
    if (!facility) {
      return res.status(404).json({
        status: "error",
        message: "Facility not found"
      });
    }

    // Optionally, populate user info for each booking
    const bookingsWithUser = await Promise.all(
      facility.bookings.map(async (booking) => {
        let userName = booking.userName;
        let userEmail = '';
        // If userName is not stored, fetch from User model
        if (!userName && booking.user) {
          const user = await User.findById(booking.user).select('name email');
          if (user) {
            userName = user.name;
            userEmail = user.email;
          }
        } else if (booking.user) {
          // If userName is stored, fetch email
          const user = await User.findById(booking.user).select('email');
          if (user) userEmail = user.email;
        }
        return {
          ...booking.toObject(),
          userName,
          userEmail
        };
      })
    );

    // Sort bookings by start time (newest first)
    bookingsWithUser.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

    return res.status(200).json({
      status: "success",
      count: bookingsWithUser.length,
      bookings: bookingsWithUser
    });
  } catch (error) {
    console.error('Error fetching facility bookings:', error);
    return res.status(500).json({
      status: "error",
      message: "Server error while fetching facility bookings"
    });
  }
});

// Cancel a booking (new version)
router.delete('/booking/:facilityId/:bookingId', async (req, res) => {
  try {
    const { facilityId, bookingId } = req.params;
    const email = req.body.email || req.query.email;

    if (!email) {
      return res.status(400).json({
        status: 'error',
        message: 'User email is required'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const facility = await Facility.findById(facilityId);
    if (!facility) {
      return res.status(404).json({
        status: 'error',
        message: 'Facility not found'
      });
    }

    const booking = facility.bookings.id(bookingId);
    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found'
      });
    }

    // Only allow user who made the booking or admin to cancel
    if (booking.user.toString() !== user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to cancel this booking'
      });
    }

    booking.status = 'cancelled';
    await facility.save();

    return res.status(200).json({
      status: 'success',
      message: 'Booking cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Server error while cancelling booking'
    });
  }
});

// Get all active bookings for a user with facility details
router.get('/user/bookings/:email', async (req, res) => {
  try {
    const email = req.params.email;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Do NOT use .populate('bookings.facility') here
    const facilities = await Facility.find({ 'bookings.user': user._id });
    // const facilities = await Facility.find({ "bookings.user": user._id })
    //   .select('name description image location hours bookings');

    let activeBookings = [];
    facilities.forEach(facility => {
      facility.bookings.forEach(booking => {
        if (
          booking.user.toString() === user._id.toString() &&
          booking.status === 'confirmed'
        ) {
          activeBookings.push({
            _id: booking._id,
            facilityId: facility._id,
            facilityName: facility.name,
            facilityDescription: facility.description,
            facilityImage: facility.image,
            facilityLocation: facility.location,
            facilityHours: facility.hours,
            startTime: booking.startTime,
            endTime: booking.endTime,
            status: booking.status,
            bookedAt: booking.bookedAt
          });
        }
      });
    });

    activeBookings.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    return res.status(200).json({
      status: "success",
      count: activeBookings.length,
      bookings: activeBookings
    });
  } catch (error) {
    console.error('Error fetching user active bookings:', error);
    return res.status(500).json({
      status: "error",
      message: "Server error while fetching bookings"
    });
  }
});

module.exports = router;