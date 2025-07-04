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
// @access  Private (Admin only)
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    console.log('Update event request body:', req.body);
    console.log('Update event file:', req.file);
    
    // Find event by ID first
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ msg: 'Event not found' });
    }
    
    const { title, description, date, startTime, endTime, location } = req.body;
    
    // Parse date if provided
    let eventDate = event.date; // Keep existing date if not provided
    if (date) {
      try {
        eventDate = new Date(date);
        if (isNaN(eventDate.getTime())) {
          return res.status(400).json({ msg: 'Invalid date format' });
        }
      } catch (err) {
        console.error('Date parsing error:', err);
        return res.status(400).json({ msg: 'Invalid date format' });
      }
    }
    
    // Create update object with all fields
    const updateFields = {
      title: title || event.title,
      description: description || event.description,
      date: eventDate,
      startTime: startTime || event.startTime,
      endTime: endTime || event.endTime,
      location: location || event.location,
      updatedAt: Date.now()
    };
    
    // Handle image update
    if (req.file) {
      console.log('New image being uploaded:', req.file.filename);
      // Remove old image if it exists
      if (event.image) {
        const oldImagePath = path.join(__dirname, '..', event.image);
        if (fs.existsSync(oldImagePath)) {
          try {
            fs.unlinkSync(oldImagePath);
            console.log('Old image removed:', oldImagePath);
          } catch (err) {
            console.error('Error removing old image:', err);
          }
        }
      }
      updateFields.image = `uploads/events/${req.file.filename}`;
    }
    
    console.log('Final update fields:', updateFields);
    
    // Use findByIdAndUpdate for atomic update
    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );
    
    if (!updatedEvent) {
      return res.status(404).json({ msg: 'Event not found after update attempt' });
    }
    
    console.log('Event updated successfully:', updatedEvent._id);
    res.status(200).json(updatedEvent);
  } catch (err) {
    console.error('Error updating event:', err);
    
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        msg: 'Validation Error', 
        error: err.message 
      });
    }
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Event not found' });
    }
    
    res.status(500).json({ 
      msg: 'Server Error', 
      error: err.message 
    });
  }
});

// @route   POST /events
// @desc    Create a new event
// @access  Private (Admin only)
router.post('/', upload.single('image'), async (req, res) => {
  try {
    console.log('Create event request body:', req.body);
    console.log('Create event file:', req.file);
    
    const { title, description, date, startTime, endTime, location } = req.body;
    
    // Validate required fields
    if (!title || !description || !date || !startTime || !endTime || !location) {
      return res.status(400).json({ msg: 'All fields are required' });
    }
    
    // Parse date
    let eventDate;
    try {
      eventDate = new Date(date);
      if (isNaN(eventDate.getTime())) {
        return res.status(400).json({ msg: 'Invalid date format' });
      }
    } catch (err) {
      console.error('Date parsing error:', err);
      return res.status(400).json({ msg: 'Invalid date format' });
    }
    
    // Create new event - simplified like CreatePost
    const newEvent = new Event({
      title,
      description,
      date: eventDate,
      startTime,
      endTime,
      location,
      image: req.file ? `uploads/events/${req.file.filename}` : null,
      attendees: []
    });
    
    console.log('New event object:', newEvent);
    
    const event = await newEvent.save();
    console.log('Event created successfully:', event._id);
    res.status(201).json(event);
  } catch (err) {
    console.error('Error creating event:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        msg: 'Validation Error', 
        error: err.message 
      });
    }
    res.status(500).json({ 
      msg: 'Server Error', 
      error: err.message 
    });
  }
});

// @route   DELETE /events/:id
// @desc    Delete an event
// @access  Private (Admin only)
router.delete('/:id', auth, async (req, res) => {
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
    
    // Delete associated image if it exists
    if (event.image) {
      const imagePath = path.join(__dirname, '..', event.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    // Use deleteOne instead of remove (which is deprecated)
    await Event.deleteOne({ _id: req.params.id });
    res.json({ msg: 'Event removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Event not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST /events/:id/rsvp
// @desc    RSVP to an event
// @access  Public (Any logged in user)
router.post('/:id/rsvp', async (req, res) => {
  try {
    const { userId, userName, userEmail } = req.body;
    
    if (!userId || !userName || !userEmail) {
      return res.status(400).json({ msg: 'Missing required user information' });
    }
    
    // Find event by ID
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ msg: 'Event not found' });
    }
    
    // Check if user already RSVP'd
    const alreadyRSVPd = event.attendees.some(attendee => 
      attendee.userEmail === userEmail || attendee.userId.toString() === userId
    );
    
    if (alreadyRSVPd) {
      return res.status(400).json({ msg: 'User already RSVP\'d to this event' });
    }
    
    // Add user to attendees
    event.attendees.push({
      userId,
      userName,
      userEmail,
      registeredAt: Date.now()
    });
    
    await event.save();
    res.json(event);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Event not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /events/:id/rsvp
// @desc    Cancel RSVP to an event
// @access  Public (Any logged in user)
router.delete('/:id/rsvp', async (req, res) => {
  try {
    const { userEmail } = req.body;
    
    if (!userEmail) {
      return res.status(400).json({ msg: 'Missing required user information' });
    }
    
    // Find event by ID
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ msg: 'Event not found' });
    }
    
    // Remove user from attendees
    event.attendees = event.attendees.filter(attendee => attendee.userEmail !== userEmail);
    
    await event.save();
    res.json(event);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Event not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;
