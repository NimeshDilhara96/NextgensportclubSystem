const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

// In-memory OTP store (for demo; use Redis/DB for production)
const signupOtpSessions = new Map();

// Nodemailer transporter (configure with your env variables)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Generate 6-digit OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP for email verification
router.post("/send-verification-otp", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(409).json({ message: "User already exists with this email." });
    }

    const otp = generateOTP();
    const sessionId = `signup_${crypto.randomUUID()}`;
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    signupOtpSessions.set(sessionId, {
        email,
        otp,
        attempts: 0,
        maxAttempts: 3,
        expiresAt
    });

    // Send OTP email
    const mailOptions = {
        from: `NextGen Sports Club <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Verify your email - NextGen Sports Club',
        html: `<p>Your verification code is:</p><h2>${otp}</h2><p>This code will expire in 5 minutes.</p>`
    };
    try {
        await transporter.sendMail(mailOptions);
        res.json({ message: `Verification code sent to ${email}`, sessionId, expiresIn: 300 });
    } catch (err) {
        console.error('Error sending verification email:', err);
        res.status(500).json({ message: 'Failed to send verification email' });
    }
});

// Verify OTP for email verification
router.post("/verify-otp", (req, res) => {
    const { sessionId, otp } = req.body;
    if (!sessionId || !otp) return res.status(400).json({ message: "Session ID and OTP are required" });

    const session = signupOtpSessions.get(sessionId);
    if (!session) return res.status(404).json({ message: "Invalid or expired session" });

    if (Date.now() > session.expiresAt) {
        signupOtpSessions.delete(sessionId);
        return res.status(401).json({ message: "Verification code expired. Please request a new one." });
    }

    if (session.attempts >= session.maxAttempts) {
        signupOtpSessions.delete(sessionId);
        return res.status(401).json({ message: "Too many incorrect attempts. Please request a new code." });
    }

    if (session.otp !== otp.toString()) {
        session.attempts++;
        signupOtpSessions.set(sessionId, session);
        return res.status(401).json({ message: `Incorrect code. ${session.maxAttempts - session.attempts} attempts left.` });
    }

    // Success: clean up session
    signupOtpSessions.delete(sessionId);
    res.json({ message: "Email verified successfully!" });
});

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
