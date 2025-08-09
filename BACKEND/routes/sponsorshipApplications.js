const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const SponsorshipApplication = require('../models/SponsorshipApplication');
const Sponsor = require('../models/Sponsor');
const auth = require('../middleware/auth');

// Set up multer storage for application documents
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const dir = './uploads/sponsorship-applications';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// Filter for document uploads
const fileFilter = (req, file, cb) => {
  // Accept images and PDFs
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|pdf|doc|docx)$/)) {
    return cb(new Error('Only image files and documents are allowed!'), false);
  }
  cb(null, true);
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  }
});

// @route   POST /sponsorship-applications
// @desc    Submit a sponsorship application
// @access  Public
router.post('/', upload.array('documents', 5), async (req, res) => {
  try {
    console.log('Application request body:', req.body);
    console.log('Application files:', req.files);
    
    const {
      applicantName,
      applicantEmail,
      phone,
      dateOfBirth,
      address,
      occupation,
      monthlyIncome,
      appliedFor,
      reasonForApplication,
      specificNeeds,
      hasReceivedSponsorshipBefore,
      previousSponsorshipDetails,
      emergencyContactName,
      emergencyContactPhone
    } = req.body;
    
    // Validate required fields
    if (!applicantName || !applicantEmail || !phone || !dateOfBirth || !address || 
        !occupation || !monthlyIncome || !appliedFor || !reasonForApplication || 
        !specificNeeds || !emergencyContactName || !emergencyContactPhone) {
      return res.status(400).json({ msg: 'All required fields must be filled' });
    }
    
    // Get sponsor details
    const sponsor = await Sponsor.findById(appliedFor);
    if (!sponsor) {
      return res.status(404).json({ msg: 'Sponsor program not found' });
    }
    
    // Process uploaded documents
    const documents = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: `uploads/sponsorship-applications/${file.filename}`
    })) : [];
    
    // Create new application
    const newApplication = new SponsorshipApplication({
      applicantName,
      applicantEmail,
      phone,
      dateOfBirth,
      address,
      occupation,
      monthlyIncome: parseFloat(monthlyIncome),
      appliedFor,
      appliedForName: sponsor.name,
      reasonForApplication,
      specificNeeds,
      hasReceivedSponsorshipBefore: hasReceivedSponsorshipBefore === 'true',
      previousSponsorshipDetails,
      emergencyContactName,
      emergencyContactPhone,
      documents
    });
    
    const application = await newApplication.save();
    console.log('Application submitted successfully:', application._id);
    
    res.status(201).json({
      success: true,
      message: 'Application submitted successfully! You will be contacted within 5-7 business days.',
      applicationId: application._id
    });
  } catch (err) {
    console.error('Error submitting application:', err);
    res.status(500).json({ 
      success: false,
      msg: 'Server Error', 
      error: err.message 
    });
  }
});

// @route   GET /sponsorship-applications/user/:email
// @desc    Get applications by user email
// @access  Public
router.get('/user/:email', async (req, res) => {
  try {
    const applications = await SponsorshipApplication.find({ 
      applicantEmail: req.params.email 
    })
    .populate('appliedFor', 'name type')
    .sort({ submittedAt: -1 });
    
    res.json(applications);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /sponsorship-applications
// @desc    Get all applications (Admin only)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(401).json({ msg: 'Not authorized as admin' });
    }
    
    const applications = await SponsorshipApplication.find()
      .populate('appliedFor', 'name type')
      .sort({ submittedAt: -1 });
    
    res.json(applications);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /sponsorship-applications/all
// @desc    Get all applications (Public for admin dashboard)
// @access  Public
router.get('/all', async (req, res) => {
  try {
    const applications = await SponsorshipApplication.find()
      .populate('appliedFor', 'name type')
      .sort({ submittedAt: -1 });
    
    res.json(applications);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /sponsorship-applications/:id/status
// @desc    Update application status (Admin only)
// @access  Private
router.put('/:id/status', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(401).json({ msg: 'Not authorized as admin' });
    }
    
    const { status, reviewNotes } = req.body;
    
    const application = await SponsorshipApplication.findByIdAndUpdate(
      req.params.id,
      {
        status,
        reviewNotes,
        reviewedBy: req.user.name,
        reviewedAt: Date.now(),
        updatedAt: Date.now()
      },
      { new: true }
    );
    
    if (!application) {
      return res.status(404).json({ msg: 'Application not found' });
    }
    
    res.json(application);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /sponsorship-applications/:id/status/admin
// @desc    Update application status (Admin route without auth for now)
// @access  Public
router.put('/:id/status/admin', async (req, res) => {
  try {
    const { status, reviewNotes, reviewedBy } = req.body;
    
    const application = await SponsorshipApplication.findByIdAndUpdate(
      req.params.id,
      {
        status,
        reviewNotes,
        reviewedBy: reviewedBy || 'Admin',
        reviewedAt: Date.now(),
        updatedAt: Date.now()
      },
      { new: true }
    );
    
    if (!application) {
      return res.status(404).json({ msg: 'Application not found' });
    }
    
    res.json(application);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;