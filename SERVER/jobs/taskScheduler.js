const cron = require("node-cron");
const pool = require("../config/db");

// This function is NOT an API
// It runs automatically in background
async function markMissedTasks() {
  try {
    await pool.execute(`
      UPDATE study_tasks
      SET status = 'missed'
      WHERE status = 'pending'
        AND scheduled_date < CURDATE()
    `);

    console.log("✔ Missed tasks updated");
  } catch (err) {
    console.error("❌ Failed to mark missed tasks:", err.message);
  }
}

// Schedule it to run every day at midnight
function startTaskScheduler() {
  cron.schedule("0 0 * * *", async () => {
    console.log("⏰ Running daily task check...");
    await markMissedTasks();
  });
}

module.exports = {
  startTaskScheduler,
};
