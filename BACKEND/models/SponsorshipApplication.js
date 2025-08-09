const mongoose = require('mongoose');

const SponsorshipApplicationSchema = new mongoose.Schema({
  applicantName: {
    type: String,
    required: true,
    trim: true
  },
  applicantEmail: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  occupation: {
    type: String,
    required: true,
    trim: true
  },
  monthlyIncome: {
    type: Number,
    required: true
  },
  appliedFor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sponsor',
    required: true
  },
  appliedForName: {
    type: String,
    required: true
  },
  reasonForApplication: {
    type: String,
    required: true,
    trim: true
  },
  specificNeeds: {
    type: String,
    required: true,
    trim: true
  },
  hasReceivedSponsorshipBefore: {
    type: Boolean,
    default: false
  },
  previousSponsorshipDetails: {
    type: String,
    trim: true
  },
  emergencyContactName: {
    type: String,
    required: true,
    trim: true
  },
  emergencyContactPhone: {
    type: String,
    required: true,
    trim: true
  },
  documents: [{
    filename: String,
    originalName: String,
    path: String
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'under_review'],
    default: 'pending'
  },
  reviewNotes: {
    type: String,
    trim: true
  },
  reviewedBy: {
    type: String,
    trim: true
  },
  reviewedAt: {
    type: Date
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
SponsorshipApplicationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('SponsorshipApplication', SponsorshipApplicationSchema);