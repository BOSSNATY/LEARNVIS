const pool = require("../config/db");

exports.getMe = async (req, res) => {
  try {
    console.log(req.user);
    const userId = req.user.userId;

    const [users] = await pool.execute(
      "SELECT id, name, email, role FROM users WHERE id = ?",
      [userId],
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(users[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateMe = async (req, res) => {
  const userId = req.user.userId;
  const { name, email } = req.body;

  try {
    const fields = [];
    const values = [];

    if (name !== undefined) {
      fields.push("name = ?");
      values.push(name);
    }

    if (email !== undefined) {
      fields.push("email = ?");
      values.push(email);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: "No data provided" });
    }

    values.push(userId);

    await pool.execute(
      `UPDATE users SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );

    res.json({ message: "User updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const [users] = await pool.execute(
      `SELECT u.id, u.name, u.email, u.role, u.created_at,
              GROUP_CONCAT(DISTINCT s.name ORDER BY s.name SEPARATOR ', ') AS subjects,
              COALESCE(ROUND(AVG(qa.score)), 0) AS average_score,
              COUNT(DISTINCT qa.id) AS quiz_attempts
       FROM users u
       LEFT JOIN user_subjects us ON us.user_id = u.id
       LEFT JOIN subjects s ON s.id = us.subject_id
       LEFT JOIN quiz_attempts qa ON qa.user_id = u.id
       GROUP BY u.id
       ORDER BY u.created_at DESC`,
    );

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, role } = req.body;

  try {
    const fields = [];
    const values = [];

    if (name !== undefined) {
      fields.push("name = ?");
      values.push(name);
    }
    if (email !== undefined) {
      fields.push("email = ?");
      values.push(email);
    }
    if (role !== undefined) {
      fields.push("role = ?");
      values.push(role);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: "No data provided" });
    }

    values.push(id);
    await pool.execute(
      `UPDATE users SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );

    res.json({ message: "User updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.execute("DELETE FROM users WHERE id = ?", [id]);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
