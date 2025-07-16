const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["member", "coach", "admin"], default: "member" },
    dob: { type: Date, required: true },
    age: { type: Number, required: true },
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
    contact: { type: String, required: true },
    profilePicture: { 
        type: String, 
        default: "default-profile.png" // You can set a default profile picture
    },
    membershipPackage: {
        type: String,
        enum: ["light", "big", "premium", "basic", "platinum", "none"],
        default: "none"
    },
    membershipStatus: {
        type: String,
        enum: ["active", "inactive", "suspended", "expired", "blocked"],
        default: "inactive"
    },
    joinedDate: { type: Date, default: Date.now },
    // New fields to connect with Sports and Facilities
    sports: [{
        sport: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Sport'
        },
        sportName: { type: String }, // <-- Add this
        category: { type: String },  // <-- Add this
        joinedAt: { type: Date, default: Date.now },
        role: { type: String, enum: ['member', 'coach', 'admin'], default: 'member' },
        status: { type: String, enum: ['active', 'inactive'], default: 'active' }
    }],
    bookings: [{
        facility: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Facility'
        },
        startTime: Date,
        endTime: Date,
        status: {
            type: String,
            enum: ['confirmed', 'pending', 'cancelled', 'completed'],
            default: 'pending'
        },
        bookedAt: {
            type: Date,
            default: Date.now
        }
    }],
    preferredSports: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sport'
    }]
});

// Hash password before saving to the database
UserSchema.pre("save", async function(next) {
    if (!this.isModified("password")) return next(); // Only hash if password is new or modified
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare entered password with stored hashed password
UserSchema.methods.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", UserSchema);

module.exports = User;
