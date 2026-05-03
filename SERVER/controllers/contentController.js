const path = require("path");
const pool = require("../config/db");
const { buildTopicContent } = require("../services/contentService");

// POST /api/content/generate
exports.generateContent = async (req, res) => {
  const userId = req.user.id || req.user.userId;
  const { topicId } = req.body;

  if (!topicId) return res.status(400).json({ error: "topicId is required" });

  try {
    const content = await buildTopicContent(topicId, userId);
    res.status(201).json({ topicId, content, source: "ai" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/content/upload
exports.uploadContent = async (req, res) => {
  const userId = req.user.id || req.user.userId;
  const { topicId, type = "upload" } = req.body;

  if (!topicId) return res.status(400).json({ error: "topicId is required" });
  if (!req.file) return res.status(400).json({ error: "file is required" });

  const fileUrl = `/uploads/${req.file.filename}`;

  try {
    const [result] = await pool.execute(
      `INSERT INTO user_materials (user_id, topic_id, type, file_url)
       VALUES (?, ?, ?, ?)`,
      [
        userId,
        topicId,
        type ||
          path.extname(req.file.originalname).replace(".", "") ||
          "upload",
        fileUrl,
      ],
    );

    res.status(201).json({
      message: "Content uploaded",
      materialId: result.insertId,
      fileUrl,
      originalName: req.file.originalname,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/content/:topicId
exports.getContent = async (req, res) => {
  const { topicId } = req.params;
  const userId = req.user?.id || req.user?.userId;

  try {
    const [[cached]] = await pool.execute(
      "SELECT * FROM content WHERE topic_id = ? ORDER BY id DESC LIMIT 1",
      [topicId],
    );

    const [materials] = await pool.execute(
      userId
        ? "SELECT * FROM user_materials WHERE topic_id = ? AND user_id = ? ORDER BY id DESC"
        : "SELECT * FROM user_materials WHERE topic_id = ? ORDER BY id DESC",
      userId ? [topicId, userId] : [topicId],
    );

    if (cached)
      return res.json({ topicId, content: cached, materials, cached: true });

    const content = await buildTopicContent(topicId, userId || null);
    res.json({
      topicId,
      content: { text_content: content, source: "ai" },
      materials,
      cached: false,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
