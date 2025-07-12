const express = require('express');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const path = require('path');
const crypto = require('crypto');
const User = require('../models/User');

const router = express.Router();

// In-memory stores (use Redis for production)
const biometricSessions = new Map();
const otpSessions = new Map();

// Debug environment variables on startup
console.log('🔍 Environment variables loaded:');
console.log('PUBLIC_URL:', process.env.PUBLIC_URL);
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);

// ✅ Secure Email Transporter (uses environment variables only)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify email transport on startup
transporter.verify((error) => {
  if (error) {
    console.error('❌ Email transporter error:', error);
  } else {
    console.log('✅ Email server ready to send messages');
  }
});

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// 📧 Send Combined Authentication Options Email
router.post('/send-auth-options', async (req, res) => {
  try {
    console.log('📧 Authentication options request received');
    console.log('Request body:', req.body);
    
    const { email } = req.body;
    if (!email) {
      console.log('❌ No email provided');
      return res.status(400).json({ message: 'Email is required' });
    }

    console.log('🔍 Looking for user with email:', email);
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found for email:', email);
      return res.status(404).json({ message: 'User not found with this email address' });
    }

    console.log('✅ User found:', user.name);

    // Check if user is blocked
    if (user.membershipStatus === 'blocked') {
      console.log('❌ User is blocked:', email);
      return res.status(403).json({ message: 'Your account has been blocked. Please contact the administrator.' });
    }

    // Generate OTP and sessions
    const otp = generateOTP();
    const otpSessionId = `otp_${crypto.randomUUID()}`;
    const biometricSessionId = `bio_${crypto.randomUUID()}`;
    
    console.log('🔢 Generated OTP:', otp);
    console.log('🆔 Created OTP session ID:', otpSessionId);
    console.log('🔐 Created Biometric session ID:', biometricSessionId);

    // Store OTP session (expires in 5 minutes)
    otpSessions.set(otpSessionId, {
      otp: otp,
      userId: user._id,
      email: user.email,
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    });

    // Store biometric session (expires in 10 minutes)
    const biometricToken = jwt.sign(
      { userId: user._id, email: user.email, name: user.name, sessionId: biometricSessionId },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    biometricSessions.set(biometricSessionId, {
      userId: user._id,
      email: user.email,
      status: 'pending',
      token: biometricToken,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });

    console.log('💾 Both sessions stored');

    // Create biometric login link
    const biometricLink = `${process.env.PUBLIC_URL}/biometric-login.html?token=${biometricToken}`;

    // Shorter, professional combined authentication email template with MommentX branding
    const mailOptions = {
      from: `"NextGen Sports Club" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Secure Login - NextGen Sports Club',
      html: `
     <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NextGen Sports Club - Secure Authentication</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      background: #f8fafc;
    }
    
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
      border: 1px solid #e2e8f0;
    }
    
    .header {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
      padding: 40px 30px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    
    .header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
      opacity: 0.3;
    }
    
    .header-content {
      position: relative;
      z-index: 1;
    }
    
    .logo {
      font-size: 28px;
      font-weight: 700;
      color: #ffffff;
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
      padding: 40px 30px;
    }
    
    .greeting {
      font-size: 18px;
      font-weight: 500;
      color: #1a1a1a;
      margin-bottom: 12px;
    }
    
    .intro-text {
      font-size: 15px;
      color: #64748b;
      margin-bottom: 32px;
      line-height: 1.5;
    }
    
    .auth-method {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 28px;
      margin-bottom: 20px;
      text-align: center;
      transition: all 0.3s ease;
    }
    
    .auth-method:hover {
      border-color: #cbd5e1;
      background: #f1f5f9;
    }
    
    .auth-icon {
      width: 48px;
      height: 48px;
      margin: 0 auto 16px;
      background: linear-gradient(135deg, #0f172a, #334155);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }
    
    .auth-title {
      font-size: 16px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 8px;
    }
    
    .auth-description {
      font-size: 13px;
      color: #64748b;
      margin-bottom: 20px;
    }
    
    .btn-primary {
      display: inline-block;
      background: linear-gradient(135deg, #0f172a, #1e293b);
      color: #ffffff;
      padding: 14px 28px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      letter-spacing: 0.5px;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
    }
    
    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(15, 23, 42, 0.2);
    }
    
    .divider {
      text-align: center;
      margin: 24px 0;
      position: relative;
    }
    
    .divider::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 1px;
      background: #e2e8f0;
    }
    
    .divider-text {
      background: #ffffff;
      padding: 0 16px;
      font-size: 12px;
      color: #64748b;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .otp-container {
      background: #ffffff;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      margin: 16px 0;
      text-align: center;
    }
    
    .otp-code {
      font-family: 'SF Mono', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', monospace;
      font-size: 32px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: 8px;
      margin: 12px 0;
      text-align: center;
      background: #f8fafc;
      padding: 16px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
    }
    
    .otp-meta {
      font-size: 11px;
      color: #94a3b8;
      margin-top: 8px;
    }
    
    .security-notice {
      background: #fef3c7;
      border: 1px solid #fbbf24;
      border-left: 4px solid #f59e0b;
      border-radius: 8px;
      padding: 20px;
      margin: 28px 0;
    }
    
    .security-title {
      font-size: 14px;
      font-weight: 600;
      color: #92400e;
      margin-bottom: 8px;
    }
    
    .security-list {
      font-size: 13px;
      color: #92400e;
      line-height: 1.6;
    }
    
    .security-list li {
      margin-bottom: 4px;
    }
    
    .footer {
      background: #f8fafc;
      padding: 24px 30px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    
    .footer-links {
      font-size: 13px;
      color: #64748b;
      margin-bottom: 12px;
    }
    
    .footer-links a {
      color: #0f172a;
      text-decoration: none;
      font-weight: 500;
    }
    
    .footer-links a:hover {
      text-decoration: underline;
    }
    
    .footer-brand {
      font-size: 11px;
      color: #94a3b8;
      margin-top: 16px;
    }
    
    .brand-highlight {
      color: #0f172a;
      font-weight: 600;
    }
    
    @media (max-width: 600px) {
      .container {
        margin: 0;
        border-radius: 0;
      }
      
      .header {
        padding: 30px 20px;
      }
      
      .main-content {
        padding: 30px 20px;
      }
      
      .footer {
        padding: 20px;
      }
      
      .otp-code {
        font-size: 24px;
        letter-spacing: 4px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="header-content">
        <div class="logo">NEXTGEN SPORTS CLUB</div>
        <div class="tagline">Secure Authentication Portal</div>
      </div>
    </div>
    
    <!-- Main Content -->
    <div class="main-content">
      <div class="greeting">Hello ${user.name},</div>
      <div class="intro-text">
        We've received a request to access your NextGen Sports Club account. 
        Please choose your preferred authentication method below to proceed securely.
      </div>
      
      <!-- Biometric Authentication -->
      <div class="auth-method">
        <div class="auth-icon">🔐</div>
        <div class="auth-title">Biometric Authentication</div>
        <div class="auth-description">
          Quick and secure access using your device's biometric features
        </div>
        <a href="${biometricLink}" class="btn-primary">
          Authenticate with Biometrics
        </a>
      </div>
      
      <!-- Divider -->
      <div class="divider">
        <span class="divider-text">Alternative Method</span>
      </div>
      
      <!-- OTP Authentication -->
      <div class="auth-method">
        <div class="auth-icon">🔢</div>
        <div class="auth-title">One-Time Password</div>
        <div class="auth-description">
          Enter the following verification code on the login screen
        </div>
        
        <div class="otp-container">
          <div class="otp-code">${otp}</div>
          <div class="otp-meta">
            Valid for 5 minutes • Maximum 3 attempts
          </div>
        </div>
      </div>
      
      <!-- Security Notice -->
      <div class="security-notice">
        <div class="security-title">🛡️ Security Guidelines</div>
        <ul class="security-list">
          <li>This authentication request will expire in 5 minutes</li>
          <li>Never share your verification code with anyone</li>
          <li>NextGen Sports Club staff will never ask for your password</li>
          <li>Report any suspicious activity to our security team immediately</li>
        </ul>
      </div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <div class="footer-links">
        © ${new Date().getFullYear()} NextGen Sports Club. All rights reserved.<br>
        <a href="https://nextgensportsclub.com/support">Support Center</a> • 
        <a href="https://nextgensportsclub.com/privacy">Privacy Policy</a> • 
        <a href="https://nextgensportsclub.com/terms">Terms of Service</a>
      </div>
      <div class="footer-brand">
        Powered by <span class="brand-highlight">Momment X</span> Security Platform
      </div>
    </div>
  </div>
</body>
</html>
      `
    };

    console.log('📬 Attempting to send authentication options email...');
    await transporter.sendMail(mailOptions);
    console.log('✅ Authentication options email sent successfully to:', email);

    res.json({ 
      message: `Authentication options sent to ${email}!`,
      email: email,
      otpSessionId: otpSessionId,
      biometricSessionId: biometricSessionId,
      expiresIn: 300 // 5 minutes for OTP
    });
  } catch (error) {
    console.error('❌ Error sending authentication options:', error);
    return res.status(500).json({ 
      message: 'Failed to send authentication options. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Keep existing endpoints for backward compatibility
router.post('/send-otp', async (req, res) => {
  // Forward to the new combined endpoint
  req.url = '/send-auth-options';
  return router.post('/send-auth-options', req, res);
});

router.post('/send-biometric-link', async (req, res) => {
  // Forward to the new combined endpoint
  req.url = '/send-auth-options';
  return router.post('/send-auth-options', req, res);
});

// 🔢 Verify OTP (unchanged)
router.post('/verify-otp', async (req, res) => {
  try {
    console.log('🔢 OTP verification received');
    console.log('Request body:', req.body);
    
    const { sessionId, otp } = req.body;
    
    if (!sessionId || !otp) {
      console.log('❌ Missing sessionId or OTP');
      return res.status(400).json({ message: 'Session ID and OTP are required' });
    }
    
    console.log('🔍 Looking up OTP session:', sessionId);
    
    if (!otpSessions.has(sessionId)) {
      console.log('❌ OTP session not found:', sessionId);
      return res.status(404).json({ message: 'Invalid or expired session' });
    }

    const session = otpSessions.get(sessionId);
    const now = new Date();

    // Check if session expired
    if (now > session.expiresAt) {
      otpSessions.delete(sessionId);
      console.log('⏰ OTP session expired:', sessionId);
      return res.status(401).json({ message: 'Verification code expired. Please request a new one.' });
    }

    // Check attempts
    if (session.attempts >= session.maxAttempts) {
      otpSessions.delete(sessionId);
      console.log('🚫 Max OTP attempts reached:', sessionId);
      return res.status(401).json({ message: 'Too many incorrect attempts. Please request a new code.' });
    }

    // Verify OTP
    if (session.otp !== otp.toString()) {
      session.attempts++;
      otpSessions.set(sessionId, session);
      console.log('❌ Incorrect OTP. Attempts:', session.attempts);
      return res.status(401).json({ 
        message: `Incorrect verification code. ${session.maxAttempts - session.attempts} attempts remaining.`
      });
    }

    console.log('✅ OTP verified successfully');

    // Get user data
    const user = await User.findById(session.userId);
    if (!user) {
      otpSessions.delete(sessionId);
      console.log('❌ User not found during OTP verification');
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is blocked
    if (user.membershipStatus === 'blocked') {
      otpSessions.delete(sessionId);
      console.log('❌ User is blocked during OTP verification:', user.email);
      return res.status(403).json({ message: 'Your account has been blocked.' });
    }

    console.log('✅ User verified:', user.name);

    // Create login token
    const loginToken = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('🔑 Login token created');

    // Clean up OTP session
    otpSessions.delete(sessionId);
    console.log('🧹 OTP session cleaned up:', sessionId);

    res.json({ 
      message: 'Login successful!',
      token: loginToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        membershipStatus: user.membershipStatus
      }
    });
  } catch (error) {
    console.error('❌ OTP verification error:', error);
    return res.status(500).json({ 
      message: 'Server error during verification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 📲 Confirm Biometric from Mobile
router.post('/confirm-biometric', async (req, res) => {
  try {
    console.log('📲 Biometric confirmation received');
    console.log('Request body:', req.body);
    
    const { token } = req.body;
    
    if (!token) {
      console.log('❌ No token provided');
      return res.status(400).json({ success: false, message: 'Token is required' });
    }
    
    console.log('🔑 Verifying JWT token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token decoded for user:', decoded.email);
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      console.log('❌ User not found during confirmation');
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if user is blocked
    if (user.membershipStatus === 'blocked') {
      console.log('❌ User is blocked during confirmation:', user.email);
      return res.status(403).json({ success: false, message: 'Your account has been blocked.' });
    }

    console.log('✅ User verified:', user.name);

    // Create a new login token that matches your Users.js login response structure
    const loginToken = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('🔑 Login token created');

    // Update session status
    const sessionId = decoded.sessionId;
    console.log('🆔 Updating session:', sessionId);
    
    if (biometricSessions.has(sessionId)) {
      biometricSessions.set(sessionId, {
        ...biometricSessions.get(sessionId),
        status: 'completed',
        loginToken: loginToken,
        completedAt: new Date(),
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          membershipStatus: user.membershipStatus
        }
      });
      console.log('✅ Session updated to completed:', sessionId);
    } else {
      console.log('⚠️ Session not found in memory:', sessionId);
    }

    res.json({ 
      success: true,
      message: 'Biometric authentication successful! You can now close this page.'
    });
  } catch (error) {
    console.error('❌ Biometric confirmation error:', error);
    console.error('Error details:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    } else {
      return res.status(500).json({ success: false, message: 'Server error during authentication' });
    }
  }
});

// 🔄 Desktop Polling - Check Biometric Status
router.get('/check-status/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    console.log('🔄 Checking status for session:', sessionId);
    
    if (!biometricSessions.has(sessionId)) {
      console.log('❌ Session not found:', sessionId);
      return res.json({ status: 'expired', message: 'Session not found' });
    }

    const session = biometricSessions.get(sessionId);
    const isExpired = new Date() - session.createdAt > 10 * 60 * 1000; // 10 minutes

    if (isExpired) {
      biometricSessions.delete(sessionId);
      console.log('⏰ Session expired and deleted:', sessionId);
      return res.json({ status: 'expired', message: 'Session expired' });
    }

    if (session.status === 'completed') {
      const sessionData = { ...session };
      biometricSessions.delete(sessionId);
      console.log('✅ Session completed, returning login data:', sessionId);
      return res.json({ 
        status: 'completed',
        token: sessionData.loginToken,
        user: sessionData.user
      });
    }

    console.log('⏳ Session still pending:', sessionId);
    res.json({ status: session.status });
  } catch (error) {
    console.error('❌ Polling error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
});

// 🧹 Auto cleanup expired sessions every 5 minutes
setInterval(() => {
  const now = new Date();
  
  // Clean up biometric sessions
  for (const [sessionId, session] of biometricSessions.entries()) {
    if (now - session.createdAt > 10 * 60 * 1000) { // 10 minutes
      biometricSessions.delete(sessionId);
      console.log(`🧹 Cleaned up expired biometric session: ${sessionId}`);
    }
  }
  
  // Clean up OTP sessions
  for (const [sessionId, session] of otpSessions.entries()) {
    if (now > session.expiresAt) {
      otpSessions.delete(sessionId);
      console.log(`🧹 Cleaned up expired OTP session: ${sessionId}`);
    }
  }
}, 5 * 60 * 1000); // Check every 5 minutes

module.exports = router;
