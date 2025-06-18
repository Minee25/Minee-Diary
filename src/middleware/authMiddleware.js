const jwt = require('jsonwebtoken');

exports.authMiddleware = (req, res, next) => {
  // Get token from cookie
  const token = req.cookies.token;

  if (!token) {
    return res.redirect('/auth/signin');
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
    return res.redirect('/auth/signin');
  }
};

exports.isAuthenticated = (req, res, next) => {
  const token = req.cookies.token;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "jwt_secret");
      req.user = decoded;
      return res.redirect("/");
    } catch (err) {
      next();
    }
  } else {
    next();
  }
}