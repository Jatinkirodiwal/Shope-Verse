const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
    return;
  }

  res.status(403);
  next(new Error("Admin access required"));
};

const roles = (...allowedRoles) => (req, res, next) => {
  if (req.user && allowedRoles.includes(req.user.role)) {
    next();
    return;
  }

  res.status(403);
  next(new Error("Access denied"));
};

module.exports = { admin, roles };
