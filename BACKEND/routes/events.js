const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Event = require('../models/Event');
const auth = require('../middleware/auth');

// Set up multer storage for event images
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const dir = './uploads/events';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// Filter for image uploads
const fileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

// @route   GET /events
// @desc    Get all events
// @access  Public
router.get('/', async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.json(events);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /events/with-counts
// @desc    Get all events with attendee counts
// @access  Private (Admin only)
router.get('/with-counts', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(401).json({ msg: 'Not authorized as admin' });
    }
    
    const events = await Event.find().sort({ date: 1 });
    
    // Add attendee count to each event
    const eventsWithCounts = events.map(event => {
      const { _id, title, description, date, startTime, endTime, location, image, createdAt, updatedAt } = event;
      return {
        _id,
        title,
        description,
        date,
        startTime,
        endTime,
        location,
        image,
        createdAt,
        updatedAt,
        attendeeCount: event.attendees ? event.attendees.length : 0
      };
    });
    
    res.json(eventsWithCounts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /events/attendees/:id
// @desc    Get all attendees for a specific event
// @access  Private (Admin only)
router.get('/attendees/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(401).json({ msg: 'Not authorized as admin' });
    }
    
    // Find event by ID
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ msg: 'Event not found' });
    }
    
    res.json(event.attendees);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Event not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET /events/:id
// @desc    Get event by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ msg: 'Event not found' });
    }
    
    res.json(event);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Event not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT /events/:id
// @desc    Update an event
// @access  Public (like CreatePost)
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    console.log('Update event request body:', req.body);
    console.log('Update event file:', req.file);
    
    const { title, description, date, startTime, endTime, location } = req.body;
    
    // Create update object
    const updateFields = {};
    if (title) updateFields.title = title;
    if (description) updateFields.description = description;
    if (date) updateFields.date = date;
    if (startTime) updateFields.startTime = startTime;
    if (endTime) updateFields.endTime = endTime;
    if (location) updateFields.location = location;
    
    // Handle image update
    if (req.file) {
      // Find existing event to remove old image
      const existingEvent = await Event.findById(req.params.id);
      if (existingEvent && existingEvent.image) {
        const oldImagePath = path.join(__dirname, '..', existingEvent.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      updateFields.image = `uploads/events/${req.file.filename}`;
    }
    
    updateFields.updatedAt = Date.now();
    
    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );
    
    if (!updatedEvent) {
      return res.status(404).json({ msg: 'Event not found' });
    }
    
    res.json(updatedEvent);
  } catch (err) {
    console.error('Error updating event:', err);
    res.status(500).json({ 
      msg: 'Server Error', 
      error: err.message 
    });
  }
});

// @route   POST /events
// @desc    Create a new event
// @access  Public (like CreatePost)
router.post('/', upload.single('image'), async (req, res) => {
  try {
    console.log('Create event request body:', req.body);
    console.log('Create event file:', req.file);
    
    const { title, description, date, startTime, endTime, location } = req.body;
    
    // Validate required fields
    if (!title || !description || !date || !startTime || !endTime || !location) {
      return res.status(400).json({ msg: 'All fields are required' });
    }
    
    // Create new event - simplified like CreatePost
    const newEvent = new Event({
      title,
      description,
      date,
      startTime,
      endTime,
      location,
      image: req.file ? `uploads/events/${req.file.filename}` : null,
      attendees: []
    });
    
    const event = await newEvent.save();
    console.log('Event created successfully:', event._id);
    res.status(201).json(event);
  } catch (err) {
    console.error('Error creating event:', err);
    res.status(500).json({ 
      msg: 'Server Error', 
      error: err.message 
    });
  }
});

// @route   DELETE /events/:id
// @desc    Delete an event
// @access  Public (like CreatePost)
router.delete('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ msg: 'Event not found' });
    }
    
    // Delete associated image if it exists
    if (event.image) {
      const imagePath = path.join(__dirname, '..', event.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    await Event.deleteOne({ _id: req.params.id });
    res.json({ msg: 'Event removed' });
  } catch (err) {
    console.error('Error deleting event:', err);
    res.status(500).json({ 
      msg: 'Server Error', 
      error: err.message 
    });
  }
});

// @route   POST /events/:id/rsvp
// @desc    RSVP to an event
// @access  Public (Any logged in user)
router.post('/:id/rsvp', async (req, res) => {
  try {
    const { userEmail } = req.body;
    
    // Validate required fields
    if (!userEmail) {
      return res.status(400).json({ 
        msg: 'User email is required' 
      });
    }
    
    // Find the user by email
    const User = require('../models/User');
    const user = await User.findOne({ email: userEmail });
    
    if (!user) {
      return res.status(404).json({ 
        msg: 'User not found' 
      });
    }
    
    // Find the event
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ msg: 'Event not found' });
    }
    
    // Check if user is already registered
    const existingAttendee = event.attendees.find(
      attendee => attendee.userEmail === userEmail
    );
    
    if (existingAttendee) {
      return res.status(400).json({ 
        msg: 'You are already registered for this event' 
      });
    }
    
    // Add user to attendees using found user data
    const newAttendee = {
      userId: user._id,
      userName: user.name || `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
      registeredAt: new Date()
    };
    
    event.attendees.push(newAttendee);
    
    // Save the event
    await event.save();
    
    console.log(`User ${newAttendee.userName} (${userEmail}) registered for event: ${event.title}`);
    
    res.json({
      msg: 'Successfully registered for event',
      event: event
    });
    
  } catch (err) {
    console.error('Error registering for event:', err);
    res.status(500).json({ 
      msg: 'Server Error', 
      error: err.message 
    });
  }
});

// @route   DELETE /events/:id/rsvp
// @desc    Cancel RSVP to an event
// @access  Public (Any logged in user)
router.delete('/:id/rsvp', async (req, res) => {
  try {
    const { userEmail } = req.body;
    
    // Validate required fields
    if (!userEmail) {
      return res.status(400).json({ 
        msg: 'User email is required' 
      });
    }
    
    // Find the event
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ msg: 'Event not found' });
    }
    
    // Check if user is registered
    const attendeeIndex = event.attendees.findIndex(
      attendee => attendee.userEmail === userEmail
    );
    
    if (attendeeIndex === -1) {
      return res.status(400).json({ 
        msg: 'You are not registered for this event' 
      });
    }
    
    // Remove user from attendees
    event.attendees.splice(attendeeIndex, 1);
    
    // Save the event
    await event.save();
    
    console.log(`User ${userEmail} cancelled registration for event: ${event.title}`);
    
    res.json({
      msg: 'Successfully cancelled registration',
      event: event
    });
    
  } catch (err) {
    console.error('Error cancelling registration:', err);
    res.status(500).json({ 
      msg: 'Server Error', 
      error: err.message 
    });
  }
});

module.exports = router;
