exports.isAdmin = (req, res, next) => {
  console.log("User role:", req.userRole); // Debugging line
  if (req.userRole !== "admin") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }
  next();
};
