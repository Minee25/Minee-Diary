const jwt = require("jsonwebtoken");

exports.setUserLocals = (req, res, next) => {
  const token = req.cookies.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jwt_secret');
      req.user = {
        userId: decoded.userId,
        username: decoded.username
      };
      res.locals.user = req.user;
    } catch (error) {
      res.clearCookie('token');
    }
  }
  next();
}; 