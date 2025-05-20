const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Signup Route
router.route("/signup").post(async (req, res) => {
    const { name, email, password, dob, age, gender, contact } = req.body;

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists with this email." });
        }

        // Create a new user
        const newUser = new User({
            name,
            email,
            password,
            dob,
            age,
            gender,
            contact
        });

        // Save the user to the database
        await newUser.save();
        res.status(201).json({ message: "User registered successfully."});
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error during registration." });
    }
});

// Login Route
router.route("/login").post(async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if the user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password." });
        }

        // Compare the entered password with the stored hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password." });
        }

        // Generate JWT token
        const token = jwt.sign({ id: user._id, email: user.email }, "secret_key", { expiresIn: "1h" });

        // Send response with the token and success message
        res.status(200).json({
            message: "Login successful.",
            token,
            user: { name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error during login." });
    }
});

module.exports = router;
