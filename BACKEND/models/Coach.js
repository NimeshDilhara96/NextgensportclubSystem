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
        type: Number,
        default: 0
    },
    bio: {
        type: String,
        default: ''
    },
    image: {
        type: String
    },
    email: { // <-- moved out of contact
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    phone: { // <-- moved out of contact
        type: String
    },
    availability: {
        type: [String],
        default: []
    },
    isActive: {
        type: Boolean,
        default: true
    },
    sports: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sport'
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Coach', coachSchema);
