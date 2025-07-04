const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Sponsor = require('../models/Sponsor');
const auth = require('../middleware/auth');

// Set up multer storage for sponsor logos
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const dir = './uploads/sponsors';
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

// @route   GET /sponsors
// @desc    Get all sponsors
// @access  Public
router.get('/', async (req, res) => {
  try {
    const sponsors = await Sponsor.find().sort({ name: 1 });
    res.json(sponsors);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /sponsors/with-details
// @desc    Get all sponsors with formatted date ranges and full details
// @access  Private (Admin only)
router.get('/with-details', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(401).json({ msg: 'Not authorized as admin' });
    }
    
    const sponsors = await Sponsor.find().sort({ name: 1 });
    
    // Format sponsor details for easier display
    const formattedSponsors = sponsors.map(sponsor => {
      // Format dates
      const startDate = new Date(sponsor.startDate).toLocaleDateString();
      const endDate = new Date(sponsor.endDate).toLocaleDateString();
      
      return {
        ...sponsor._doc,
        formattedStartDate: startDate,
        formattedEndDate: endDate,
        duration: `${startDate} - ${endDate}`,
        formattedAmount: `$${sponsor.amount.toLocaleString()}`
      };
    });
    
    res.json(formattedSponsors);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /sponsors/:id
// @desc    Get sponsor by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const sponsor = await Sponsor.findById(req.params.id);
    
    if (!sponsor) {
      return res.status(404).json({ msg: 'Sponsor not found' });
    }
    
    res.json(sponsor);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Sponsor not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST /sponsors
// @desc    Create a new sponsor
// @access  Public (like CreatePost)
router.post('/', upload.single('logo'), async (req, res) => {
  try {
    console.log('Create sponsor request body:', req.body);
    console.log('Create sponsor file:', req.file);
    
    const { 
      name, 
      type, 
      contactName, 
      email, 
      phone, 
      website, 
      startDate, 
      endDate, 
      amount, 
      description 
    } = req.body;
    
    // Validate required fields
    if (!name || !type || !contactName || !email || !phone || !startDate || !endDate || !description) {
      return res.status(400).json({ msg: 'All required fields must be filled' });
    }
    
    // Create new sponsor - simplified like CreatePost
    const newSponsor = new Sponsor({
      name,
      type,
      contactName,
      email,
      phone,
      website,
      startDate,
      endDate,
      amount: amount || 0,
      description,
      logo: req.file ? `uploads/sponsors/${req.file.filename}` : null
    });
    
    const sponsor = await newSponsor.save();
    console.log('Sponsor created successfully:', sponsor._id);
    res.status(201).json(sponsor);
  } catch (err) {
    console.error('Error creating sponsor:', err);
    res.status(500).json({ 
      msg: 'Server Error', 
      error: err.message 
    });
  }
});

// @route   PUT /sponsors/:id
// @desc    Update a sponsor
// @access  Public (like CreatePost)
router.put('/:id', upload.single('logo'), async (req, res) => {
  try {
    console.log('Update sponsor request body:', req.body);
    console.log('Update sponsor file:', req.file);
    
    const { 
      name, 
      type, 
      contactName, 
      email, 
      phone, 
      website, 
      startDate, 
      endDate, 
      amount, 
      description 
    } = req.body;
    
    // Create update object
    const updateFields = {};
    if (name) updateFields.name = name;
    if (type) updateFields.type = type;
    if (contactName) updateFields.contactName = contactName;
    if (email) updateFields.email = email;
    if (phone) updateFields.phone = phone;
    if (website) updateFields.website = website;
    if (startDate) updateFields.startDate = startDate;
    if (endDate) updateFields.endDate = endDate;
    if (amount) updateFields.amount = amount;
    if (description) updateFields.description = description;
    
    // Handle logo update
    if (req.file) {
      // Find existing sponsor to remove old logo
      const existingSponsor = await Sponsor.findById(req.params.id);
      if (existingSponsor && existingSponsor.logo) {
        const oldLogoPath = path.join(__dirname, '..', existingSponsor.logo);
        if (fs.existsSync(oldLogoPath)) {
          fs.unlinkSync(oldLogoPath);
        }
      }
      updateFields.logo = `uploads/sponsors/${req.file.filename}`;
    }
    
    updateFields.updatedAt = Date.now();
    
    const updatedSponsor = await Sponsor.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );
    
    if (!updatedSponsor) {
      return res.status(404).json({ msg: 'Sponsor not found' });
    }
    
    res.json(updatedSponsor);
  } catch (err) {
    console.error('Error updating sponsor:', err);
    res.status(500).json({ 
      msg: 'Server Error', 
      error: err.message 
    });
  }
});

// @route   DELETE /sponsors/:id
// @desc    Delete a sponsor
// @access  Public (like CreatePost)
router.delete('/:id', async (req, res) => {
  try {
    const sponsor = await Sponsor.findById(req.params.id);
    
    if (!sponsor) {
      return res.status(404).json({ msg: 'Sponsor not found' });
    }
    
    // Delete associated logo if it exists
    if (sponsor.logo) {
      const logoPath = path.join(__dirname, '..', sponsor.logo);
      if (fs.existsSync(logoPath)) {
        fs.unlinkSync(logoPath);
      }
    }
    
    await Sponsor.deleteOne({ _id: req.params.id });
    res.json({ msg: 'Sponsor removed' });
  } catch (err) {
    console.error('Error deleting sponsor:', err);
    res.status(500).json({ 
      msg: 'Server Error', 
      error: err.message 
    });
  }
});

module.exports = router;
