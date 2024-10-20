const jwt = require("jsonwebtoken");

exports.authenticate = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(403).json({ message: "No token provided" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Unauthorized" });

    // decoded should now contain 'id' and 'role' from the token payload
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  });
};
