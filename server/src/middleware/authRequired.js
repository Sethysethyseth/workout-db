module.exports = function authRequired(req, res, next) {
  if (!req.authUserId) {
    return res.status(401).json({
      error: "Authentication required",
    });
  }

  next();
};