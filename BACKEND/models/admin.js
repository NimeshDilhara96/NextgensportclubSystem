const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
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
    email: { // Add this field if you want to keep the index
        type: String,
        unique: true,
        sparse: true // Optional: allows multiple docs without email
    }
}, {
    timestamps: true
});

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
