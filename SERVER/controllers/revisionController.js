const pool = require("../config/db");

// GET /api/revision/due — get topics due for spaced revision today
exports.getDueRevisions = async (req, res) => {
  const userId = req.user.userId;

  try {
    const [due] = await pool.execute(
      `SELECT r.id, r.topic_id, r.next_review_date, r.interval_days,
              r.review_count, t.title AS topic_title, s.name AS subject_name
       FROM revisions r
       JOIN topics t ON r.topic_id = t.id
       LEFT JOIN subjects s ON t.subject_id = s.id
       WHERE r.user_id = ? AND r.next_review_date <= CURDATE()
       ORDER BY r.next_review_date ASC`,
      [userId],
    );

    res.json({
      count: due.length,
      dueRevisions: due,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/revision/schedule — schedule or reschedule a topic for spaced revision
exports.scheduleRevision = async (req, res) => {
  const userId = req.user.userId;
  const { topicId } = req.body;

  if (!topicId) return res.status(400).json({ error: "topicId is required" });

  try {
    const [[existing]] = await pool.execute(
      "SELECT id, interval_days, review_count FROM revisions WHERE user_id = ? AND topic_id = ?",
      [userId, topicId],
    );

    // Spaced repetition intervals: 1 → 3 → 7 → 14 → 30 days
    const INTERVALS = [1, 3, 7, 14, 30];

    if (existing) {
      const nextIdx = Math.min(existing.review_count, INTERVALS.length - 1);
      const nextInterval = INTERVALS[nextIdx];

      await pool.execute(
        `UPDATE revisions
         SET interval_days = ?, next_review_date = DATE_ADD(CURDATE(), INTERVAL ? DAY),
             review_count = review_count + 1, updated_at = NOW()
         WHERE id = ?`,
        [nextInterval, nextInterval, existing.id],
      );

      return res.json({
        message: "Revision rescheduled",
        nextReviewInDays: nextInterval,
      });
    }

    // First-time scheduling — 1 day
    await pool.execute(
      `INSERT INTO revisions (user_id, topic_id, interval_days, next_review_date, review_count)
       VALUES (?, ?, 1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), 0)`,
      [userId, topicId],
    );

    res
      .status(201)
      .json({ message: "Revision scheduled", nextReviewInDays: 1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/revision/:revisionId/complete — mark a revision done & advance interval
exports.completeRevision = async (req, res) => {
  const userId = req.user.userId;
  const { revisionId } = req.params;
  const { quality } = req.body; // 0 = forgot, 1 = hard, 2 = easy

  try {
    const [[revision]] = await pool.execute(
      "SELECT * FROM revisions WHERE id = ? AND user_id = ?",
      [revisionId, userId],
    );
    if (!revision) return res.status(404).json({ error: "Revision not found" });

    const INTERVALS = [1, 3, 7, 14, 30];
    let nextIdx = revision.review_count;

    // If quality is 0 (forgot), reset interval
    if (quality === 0) nextIdx = 0;
    else nextIdx = Math.min(nextIdx + 1, INTERVALS.length - 1);

    const nextInterval = INTERVALS[nextIdx];

    await pool.execute(
      `UPDATE revisions
       SET interval_days = ?, next_review_date = DATE_ADD(CURDATE(), INTERVAL ? DAY),
           review_count = ?, updated_at = NOW()
       WHERE id = ?`,
      [nextInterval, nextInterval, nextIdx, revisionId],
    );

    res.json({ message: "Revision complete", nextReviewInDays: nextInterval });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/revision/history
exports.getRevisionHistory = async (req, res) => {
  const userId = req.user.userId;

  try {
    const [history] = await pool.execute(
      `SELECT r.*, t.title AS topic_title, s.name AS subject_name
       FROM revisions r
       JOIN topics t ON r.topic_id = t.id
       LEFT JOIN subjects s ON t.subject_id = s.id
       WHERE r.user_id = ?
       ORDER BY r.updated_at DESC`,
      [userId],
    );
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
