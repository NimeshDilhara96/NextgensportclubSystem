const mongoose = require('mongoose');

const coachSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    specialty: {
        type: String,
        required: true
    },
    experience: {
        type: Number,  // Years of experience
        default: 0
    },
    bio: {
        type: String,
        default: ''
    },
    image: {
        type: String  // Path to profile image
    },
    contact: {
        email: String,
        phone: String
    },
    availability: {
        type: [String],  // Days/times available
        default: []
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const Coach = mongoose.model('Coach', coachSchema);

module.exports = Coach;
