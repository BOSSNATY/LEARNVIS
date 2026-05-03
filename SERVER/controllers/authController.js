const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || "15m";
const REFRESH_TOKEN_DAYS = Number(process.env.REFRESH_TOKEN_DAYS || 30);

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role || "student",
  };
}

function signAccessToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role || "student",
      jti: crypto.randomUUID(),
    },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL },
  );
}

function hashRefreshToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function ensureAuthTables() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      user_id BIGINT NOT NULL,
      token_hash VARCHAR(255) NOT NULL,
      revoked BOOLEAN DEFAULT FALSE,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      replaced_by BIGINT NULL,
      INDEX idx_refresh_token_hash (token_hash),
      INDEX idx_refresh_user (user_id)
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS revoked_tokens (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      jti VARCHAR(80) UNIQUE NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_revoked_jti (jti)
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS oauth_accounts (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      user_id BIGINT NOT NULL,
      provider ENUM('google') NOT NULL,
      provider_user_id VARCHAR(120) NOT NULL,
      email VARCHAR(120),
      UNIQUE KEY unique_provider_account (provider, provider_user_id)
    )
  `);
}

async function createRefreshToken(userId) {
  await ensureAuthTables();
  const refreshToken = crypto.randomBytes(48).toString("hex");
  await pool.execute(
    "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? DAY))",
    [userId, hashRefreshToken(refreshToken), REFRESH_TOKEN_DAYS],
  );
  return refreshToken;
}

async function verifyGoogleCredential(credential) {
  const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`;
  const response = await fetch(url);
  const profile = await response.json();

  if (!response.ok || !profile.email || !profile.sub) {
    throw new Error(profile.error_description || "Invalid Google credential");
  }

  if (
    process.env.GOOGLE_CLIENT_ID &&
    profile.aud !== process.env.GOOGLE_CLIENT_ID
  ) {
    throw new Error("Google credential audience mismatch");
  }

  return profile;
}

exports.signup = async (req, res) => {
  const { name, email, password, adminCode } = req.body;
  const connection = await pool.getConnection();

  try {
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "name, email and password are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const role =
      adminCode && adminCode === process.env.ADMIN_SIGNUP_CODE
        ? "admin"
        : "student";

    await connection.beginTransaction();

    // 1. Create the User profile
    const [userResult] = await connection.execute(
      "INSERT INTO users (name, email, role) VALUES (?, ?, ?)",
      [name.trim(), normalizedEmail, role],
    );
    const userId = userResult.insertId;

    // 2. Hash password and save to user_credentials
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await connection.execute(
      "INSERT INTO user_credentials (user_id, password_hash) VALUES (?, ?)",
      [userId, hashedPassword],
    );

    await connection.commit();
    const user = {
      id: userId,
      name: name.trim(),
      email: normalizedEmail,
      role,
    };
    const refreshToken = await createRefreshToken(userId);
    const token = signAccessToken(user);

    res.status(201).json({
      message: "User registered successfully",
      userId,
      token,
      refreshToken,
      user: sanitizeUser(user),
    });
  } catch (error) {
    await connection.rollback();
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    // 1. Check if user exists and get their credentials
    const [users] = await pool.execute(
      "SELECT u.id, u.name, u.email, u.role, c.password_hash FROM users u " +
        "JOIN user_credentials c ON u.id = c.user_id " +
        "WHERE u.email = ?",
      [email.trim().toLowerCase()],
    );

    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = users[0];

    // 2. Compare password with the hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // 3. Create access + refresh tokens
    const token = signAccessToken(user);

    const refreshToken = await createRefreshToken(user.id);

    res.json({
      message: "Login successful",
      token,
      refreshToken,
      user: sanitizeUser(user),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.logout = async (req, res) => {
  const { refreshToken } = req.body;

  try {
    await ensureAuthTables();

    if (refreshToken) {
      await pool.execute(
        "UPDATE refresh_tokens SET revoked = 1 WHERE token_hash = ?",
        [hashRefreshToken(refreshToken)],
      );
    }

    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;
    if (accessToken) {
      const decoded = jwt.decode(accessToken);
      if (decoded?.jti && decoded?.exp) {
        await pool.execute(
          "INSERT IGNORE INTO revoked_tokens (jti, expires_at) VALUES (?, FROM_UNIXTIME(?))",
          [decoded.jti, decoded.exp],
        );
      }
    }

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.refresh = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: "refreshToken is required" });
  }

  try {
    await ensureAuthTables();
    const [tokens] = await pool.execute(
      `SELECT rt.id, rt.user_id, u.name, u.email, u.role
       FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token_hash = ? AND rt.revoked = 0 AND rt.expires_at > NOW()`,
      [hashRefreshToken(refreshToken)],
    );

    if (!tokens.length) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const session = tokens[0];
    const newRefreshToken = await createRefreshToken(session.user_id);
    const [[newRefreshRow]] = await pool.execute(
      "SELECT id FROM refresh_tokens WHERE token_hash = ? LIMIT 1",
      [hashRefreshToken(newRefreshToken)],
    );
    await pool.execute(
      "UPDATE refresh_tokens SET revoked = 1, replaced_by = ? WHERE id = ?",
      [newRefreshRow?.id || null, session.id],
    );

    const user = {
      id: session.user_id,
      name: session.name,
      email: session.email,
      role: session.role,
    };
    const token = signAccessToken(user);

    res.json({
      message: "Token refreshed",
      token,
      refreshToken: newRefreshToken,
      user: sanitizeUser(user),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.google = async (req, res) => {
  const { credential } = req.body;
  if (!credential)
    return res.status(400).json({ error: "Google credential is required" });

  const connection = await pool.getConnection();

  try {
    await ensureAuthTables();
    const profile = await verifyGoogleCredential(credential);
    await connection.beginTransaction();

    const [oauthRows] = await connection.execute(
      "SELECT user_id FROM oauth_accounts WHERE provider = 'google' AND provider_user_id = ?",
      [profile.sub],
    );

    let userId = oauthRows[0]?.user_id;

    if (!userId) {
      const [userRows] = await connection.execute(
        "SELECT id FROM users WHERE email = ?",
        [profile.email.toLowerCase()],
      );
      userId = userRows[0]?.id;

      if (!userId) {
        const [created] = await connection.execute(
          "INSERT INTO users (name, email, profile_image, role) VALUES (?, ?, ?, 'student')",
          [
            profile.name || profile.email.split("@")[0],
            profile.email.toLowerCase(),
            profile.picture || null,
          ],
        );
        userId = created.insertId;
      }

      await connection.execute(
        "INSERT IGNORE INTO oauth_accounts (user_id, provider, provider_user_id, email) VALUES (?, 'google', ?, ?)",
        [userId, profile.sub, profile.email.toLowerCase()],
      );
    }

    const [[user]] = await connection.execute(
      "SELECT id, name, email, role FROM users WHERE id = ?",
      [userId],
    );
    await connection.commit();

    const token = signAccessToken(user);
    const refreshToken = await createRefreshToken(user.id);

    res.json({
      message: "Google login successful",
      token,
      refreshToken,
      user: sanitizeUser(user),
    });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};
