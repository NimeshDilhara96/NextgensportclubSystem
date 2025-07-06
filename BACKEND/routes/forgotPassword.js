const express = require('express');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const User = require('../models/User');

const router = express.Router();

// In-memory store for password reset sessions (use Redis for production)
const resetSessions = new Map();

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// 📧 Send Password Reset OTP
router.post('/send-reset-otp', async (req, res) => {
  try {
    console.log('🔄 Password reset request received');
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email address' });
    }

    // Check if user is blocked
    if (user.membershipStatus === 'blocked') {
      return res.status(403).json({ message: 'Your account has been blocked. Please contact the administrator.' });
    }

    // Generate OTP and session
    const otp = generateOTP();
    const sessionId = `reset_${crypto.randomUUID()}`;
    
    // Store reset session (expires in 10 minutes)
    resetSessions.set(sessionId, {
      otp: otp,
      userId: user._id,
      email: user.email,
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      verified: false
    });

    // Send email with OTP
    const mailOptions = {
      from: `"NextGen Sports Club" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset - NextGen Sports Club',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; line-height: 1.5;">
          <div style="max-width: 500px; margin: 20px auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 30px 20px; text-align: center;">
              <div style="background: white; width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; font-size: 24px;">
                🔐
              </div>
              <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Password Reset</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">NextGen Sports Club</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px 20px;">
              <p style="color: #333; margin: 0 0 20px 0; font-size: 16px;">Hello <strong>${user.name}</strong>,</p>
              <p style="color: #666; margin: 0 0 25px 0; font-size: 14px;">We received a request to reset your password. Use the verification code below:</p>
              
              <!-- OTP Section -->
              <div style="background: #f8f9fa; border-radius: 8px; padding: 25px; margin: 20px 0; text-align: center; border: 1px solid #e9ecef;">
                <div style="font-size: 32px; margin-bottom: 15px;">🔑</div>
                <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">Verification Code</h3>
                
                <div style="
                  background: white;
                  border: 2px solid #dc3545;
                  border-radius: 8px;
                  padding: 20px;
                  margin: 15px 0;
                  font-family: 'Courier New', monospace;
                  font-size: 28px;
                  font-weight: 700;
                  color: #dc3545;
                  letter-spacing: 6px;
                ">
                  ${otp}
                </div>
                
                <p style="color: #666; margin: 15px 0 0 0; font-size: 12px;">
                  <strong>⏱️ Valid for 10 minutes</strong> • <strong>🔢 3 attempts allowed</strong>
                </p>
              </div>
              
              <!-- Security Notice -->
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0;">
                <h4 style="color: #856404; margin: 0 0 10px 0; font-size: 14px; font-weight: 600;">🔒 Security Notice</h4>
                <ul style="color: #856404; margin: 0; padding-left: 20px; font-size: 12px; line-height: 1.4;">
                  <li>This code expires automatically for your security</li>
                  <li>Don't share this code with anyone</li>
                  <li>If you didn't request this, please ignore this email</li>
                  <li>Your current password remains unchanged until reset</li>
                </ul>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef; font-size: 12px; color: #666;">
              <p style="margin: 0 0 10px 0;">
                Account: ${email}<br>
                Request Time: ${new Date().toLocaleString()}
              </p>
              <p style="margin: 10px 0 0 0;">
                <a href="mailto:support@nextgensportsclub.com" style="color: #dc3545; text-decoration: none;">Need help?</a>
              </p>
            </div>
          </div>
          
          <!-- MommentX Security Branding -->
          <div style="text-align: center; margin: 15px 0;">
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
            ">
              <span style="font-size: 14px;">🔒</span>
              <span>Secured by</span>
              <span style="font-weight: 700;">MommentX</span>
            </a>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent to:', email);

    res.json({ 
      message: `Password reset code sent to ${email}`,
      sessionId: sessionId,
      expiresIn: 600 // 10 minutes
    });
  } catch (error) {
    console.error('❌ Error sending reset email:', error);
    res.status(500).json({ 
      message: 'Failed to send password reset email. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 🔢 Verify Reset OTP
router.post('/verify-reset-otp', async (req, res) => {
  try {
    console.log('🔢 Reset OTP verification received');
    const { sessionId, otp } = req.body;
    
    if (!sessionId || !otp) {
      return res.status(400).json({ message: 'Session ID and OTP are required' });
    }
    
    if (!resetSessions.has(sessionId)) {
      return res.status(404).json({ message: 'Invalid or expired session' });
    }

    const session = resetSessions.get(sessionId);
    const now = new Date();

    // Check if session expired
    if (now > session.expiresAt) {
      resetSessions.delete(sessionId);
      return res.status(401).json({ message: 'Verification code expired. Please request a new one.' });
    }

    // Check attempts
    if (session.attempts >= session.maxAttempts) {
      resetSessions.delete(sessionId);
      return res.status(401).json({ message: 'Too many incorrect attempts. Please request a new code.' });
    }

    // Verify OTP
    if (session.otp !== otp.toString()) {
      session.attempts++;
      resetSessions.set(sessionId, session);
      return res.status(401).json({ 
        message: `Incorrect verification code. ${session.maxAttempts - session.attempts} attempts remaining.`
      });
    }

    // Mark session as verified
    session.verified = true;
    session.verifiedAt = new Date();
    resetSessions.set(sessionId, session);

    console.log('✅ Reset OTP verified successfully');

    res.json({ 
      message: 'Verification successful! You can now reset your password.',
      verified: true
    });
  } catch (error) {
    console.error('❌ Reset OTP verification error:', error);
    res.status(500).json({ 
      message: 'Server error during verification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 🔄 Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    console.log('🔄 Password reset attempt');
    const { sessionId, newPassword } = req.body;
    
    if (!sessionId || !newPassword) {
      return res.status(400).json({ message: 'Session ID and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }
    
    if (!resetSessions.has(sessionId)) {
      return res.status(404).json({ message: 'Invalid or expired session' });
    }

    const session = resetSessions.get(sessionId);
    const now = new Date();

    // Check if session expired
    if (now > session.expiresAt) {
      resetSessions.delete(sessionId);
      return res.status(401).json({ message: 'Session expired. Please start the reset process again.' });
    }

    // Check if OTP was verified
    if (!session.verified) {
      return res.status(401).json({ message: 'Please verify your OTP first' });
    }

    // Update user password
    const user = await User.findById(session.userId);
    if (!user) {
      resetSessions.delete(sessionId);
      return res.status(404).json({ message: 'User not found' });
    }

    user.password = newPassword; // This will be hashed by the pre-save middleware
    await user.save();

    // Clean up session
    resetSessions.delete(sessionId);
    
    console.log('✅ Password reset successful for:', user.email);

    res.json({ 
      message: 'Password reset successful! You can now login with your new password.'
    });
  } catch (error) {
    console.error('❌ Password reset error:', error);
    res.status(500).json({ 
      message: 'Server error during password reset',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 🧹 Auto cleanup expired sessions every 5 minutes
setInterval(() => {
  const now = new Date();
  for (const [sessionId, session] of resetSessions.entries()) {
    if (now > session.expiresAt) {
      resetSessions.delete(sessionId);
      console.log(`🧹 Cleaned up expired reset session: ${sessionId}`);
    }
  }
}, 5 * 60 * 1000);

module.exports = router;