const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        status: "error", 
        message: "Authentication required" 
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
    
    // Find user and check status
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ status: "error", message: "User not found" });
    }
    
    // Check if user is blocked AFTER login
    if (user.membershipStatus === 'blocked') {
      return res.status(403).json({
        status: "error",
        message: "Your account has been blocked. Please contact the administrator."
      });
    }
    
    // Add user to request for use in route handlers
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ status: "error", message: "Invalid authentication" });
  }
};

module.exports = auth;