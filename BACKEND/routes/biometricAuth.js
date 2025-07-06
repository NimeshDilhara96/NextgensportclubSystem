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
          <title>NextGen Sports Club - Login</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; line-height: 1.5; position: relative;">
          <div style="max-width: 500px; margin: 20px auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">NextGen Sports Club</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Secure Login Options</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px 20px;">
              <p style="color: #333; margin: 0 0 20px 0; font-size: 16px;">Hello <strong>${user.name}</strong>,</p>
              <p style="color: #666; margin: 0 0 25px 0; font-size: 14px;">Choose your preferred login method:</p>
              
              <!-- Biometric Option -->
              <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 15px 0; text-align: center; border: 1px solid #e9ecef;">
                <div style="font-size: 28px; margin-bottom: 10px;">🔐</div>
                <h3 style="color: #333; margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">Biometric Login (Mobile)</h3>
                <a href="${biometricLink}" style="
                  display: inline-block;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  padding: 12px 24px;
                  border-radius: 6px;
                  text-decoration: none;
                  font-weight: 600;
                  font-size: 14px;
                  margin: 8px 0;
                ">
                  Login with Face ID / Fingerprint
                </a>
              </div>
              
              <!-- Divider -->
              <div style="text-align: center; margin: 20px 0; position: relative;">
                <div style="height: 1px; background: #ddd;"></div>
                <span style="background: white; padding: 0 15px; color: #666; font-size: 12px; position: absolute; top: -6px; left: 50%; transform: translateX(-50%);">OR</span>
              </div>
              
              <!-- OTP Option -->
              <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 15px 0; text-align: center; border: 1px solid #e9ecef;">
                <div style="font-size: 28px; margin-bottom: 10px;">📧</div>
                <h3 style="color: #333; margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">Verification Code</h3>
                <p style="color: #666; margin: 0 0 15px 0; font-size: 13px;">Enter this code on the login page:</p>
                
                <div style="
                  background: white;
                  border: 2px solid #4285f4;
                  border-radius: 6px;
                  padding: 15px;
                  margin: 10px 0;
                  font-family: 'Courier New', monospace;
                  font-size: 24px;
                  font-weight: 700;
                  color: #333;
                  letter-spacing: 4px;
                ">
                  ${otp}
                </div>
                <p style="color: #999; margin: 8px 0 0 0; font-size: 11px;">Valid for 5 minutes • 3 attempts</p>
              </div>
              
              <!-- Quick Info -->
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0;">
                <p style="color: #856404; margin: 0; font-size: 12px;">
                  <strong>💡 Quick Tips:</strong><br>
                  • Biometric: Mobile devices only<br>
                  • Code: Works on any device<br>
                  • Both expire automatically for security
                </p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef; font-size: 12px; color: #666;">
              <p style="margin: 0 0 10px 0;">
                Account: ${email} • ${new Date().toLocaleString()}<br>
                <a href="mailto:support@nextgensportsclub.com" style="color: #4285f4; text-decoration: none;">Need help?</a>
              </p>
            </div>
          </div>
          
          <!-- MommentX Security Branding -->
          <div style="text-align: center; margin: 15px 0; position: relative;">
            <a href="https://momentx.com" target="_blank" style="
              display: inline-flex;
              align-items: center;
              gap: 6px;
              padding: 8px 12px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-decoration: none;
              border-radius: 20px;
              font-size: 11px;
              font-weight: 500;
              box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
              transition: all 0.3s ease;
            ">
              <span style="font-size: 14px;">🔒</span>
              <span>Secured by</span>
              <span style="font-weight: 700; color: #fff;">MommentX</span>
            </a>
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
