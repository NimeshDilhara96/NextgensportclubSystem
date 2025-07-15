const mongoose = require('mongoose');

// Define the member schema for users who join a sport
const MemberSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    userEmail: {
        type: String,
        required: true
    },
    joinedAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'pending'],
        default: 'active'
    }
});

const SportSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    image: {
        type: String,
        default: 'https://via.placeholder.com/100x100?text=Sport'
    },
    category: {
        type: String,
        required: false
    },
    schedule: {
        type: String,
        required: false
    },
    coaches: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coach'
    }],
    maxCapacity: {
        type: Number,
        default: 20
    },
    memberCount: {
        type: Number,
        default: 0
    },
    members: [MemberSchema],
    availability: {
        type: String,
        enum: ['Available', 'Unavailable'],
        default: 'Available'
    }
}, { timestamps: true });

module.exports = mongoose.model('Sport', SportSchema);