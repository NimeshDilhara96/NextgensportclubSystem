const mongoose = require('mongoose');

const FacilitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Facility name is required"],
        trim: true
    },
    description: {
        type: String,
        required: [true, "Description is required"]
    },
    image: {
        type: String,
        default: "default-facility.jpg"
    },
    hours: {
        type: String,
        required: [true, "Operating hours are required"]
    },
    availability: {
        type: String,
        enum: ['Available', 'Maintenance', 'Reserved', 'Closed'],
        default: 'Available'
    },
    capacity: {
        type: Number,
        required: [true, "Capacity is required"]
    },
    location: {
        type: String,
        default: "Main Building"
    },
    amenities: [{
        type: String
    }],
    rules: [{
        type: String
    }],
    sportTypes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sport'
    }],
    bookings: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        userName: { type: String }, // Optional: for quick access
        startTime: { type: Date, required: true },
        endTime: { type: Date, required: true },
        status: {
            type: String,
            enum: ['confirmed', 'pending', 'cancelled', 'completed'],
            default: 'confirmed'
        },
        bookedAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const Facility = mongoose.model('Facility', FacilitySchema);

module.exports = Facility;