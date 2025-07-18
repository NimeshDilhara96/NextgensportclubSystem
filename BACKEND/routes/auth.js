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
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verification - NextGen Sports Club</title>
  <style>
    body {
      font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #f8fafc;
      color: #1a1a1a;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 480px;
      margin: 0 auto;
      background: #fff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0,0,0,0.08);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
      padding: 32px 24px;
      text-align: center;
      color: #fff;
    }
    .logo {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.5px;
      margin-bottom: 8px;
    }
    .tagline {
      color: #94a3b8;
      font-size: 14px;
      font-weight: 400;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .main-content {
      padding: 32px 24px;
      text-align: center;
    }
    .otp-box {
      display: inline-block;
      background: #f1f5f9;
      color: #0f172a;
      font-size: 32px;
      font-weight: 700;
      letter-spacing: 8px;
      padding: 16px 32px;
      border-radius: 8px;
      margin: 24px 0 16px 0;
      border: 1px solid #e2e8f0;
    }
    .footer {
      background: #f8fafc;
      padding: 20px 24px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
      font-size: 12px;
      color: #94a3b8;
    }
    @media (max-width: 600px) {
      .container { margin: 0; border-radius: 0; }
      .header, .main-content, .footer { padding: 16px !important; }
      .otp-box { font-size: 24px; padding: 12px 16px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">NEXTGEN SPORTS CLUB</div>
      <div class="tagline">Email Verification</div>
    </div>
    <div class="main-content">
      <h2 style="color:#0f172a;">Verify Your Email</h2>
      <p style="font-size:16px;">Your verification code is:</p>
      <div class="otp-box">${otp}</div>
      <p style="font-size:14px;color:#64748b;">This code will expire in 5 minutes.</p>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} NextGen Sports Club. Powered by <b>Momment X</b>.
    </div>
  </div>
</body>
</html>
        `
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
