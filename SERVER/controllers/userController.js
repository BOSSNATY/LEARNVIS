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
