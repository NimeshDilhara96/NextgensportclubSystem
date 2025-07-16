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
        default: "default-profile.png"
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
    // Store both sport ObjectId and name in preferredSports
    preferredSports: [{
        sportId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Sport'
        },
        name: {
            type: String
        }
    }]
});

// Hash password before saving to the database
UserSchema.pre("save", async function(next) {
    if (!this.isModified("password")) return next();
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
