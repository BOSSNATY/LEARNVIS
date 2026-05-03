const jwt = require("jsonwebtoken");
const pool = require("../config/db");

exports.authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.jti) {
      try {
        const [revoked] = await pool.execute(
          "SELECT id FROM revoked_tokens WHERE jti = ? AND expires_at > NOW() LIMIT 1",
          [decoded.jti],
        );

        if (revoked.length) {
          return res.status(401).json({ message: "Token has been revoked" });
        }
      } catch (_err) {
        // If the table is not migrated yet, keep old tokens working.
      }
    }

    // Normalize: always expose both .userId and .id so all controllers work
    req.user = decoded;
    req.user.id = decoded.userId; // alias so controllers using .id also work
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
