const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // Get token from cookie
  const token = req.cookies.token;

  if (!token) {
    return res.redirect('/signin');
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jwt_secret');
    
    // Set user info in request
    req.user = decoded;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.clearCookie('token');
    return res.redirect('/signin');
  }
};

module.exports = authMiddleware; 