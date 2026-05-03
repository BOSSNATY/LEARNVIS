const jwt = require("jsonwebtoken");

exports.authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Normalize: always expose both .userId and .id so all controllers work
    req.user = decoded;
    req.user.id = decoded.userId; // alias so controllers using .id also work
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
