require("dotenv").config();
const express = require("express");
const cors = require("cors");

// Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const topicRoutes = require("./routes/topicRoutes");
const learningRoutes = require("./routes/learningRoutes");
const learningStateRoutes = require("./routes/learningStateRoutes");
const studyPlanRoutes = require("./routes/studyPlanRoutes");
const studySessionsRoutes = require("./routes/studySessionsRoutes");
const studyTaskRoutes = require("./routes/studyTaskRoutes");
const quizRoutes = require("./routes/quizRoutes");
const mistakeRoutes = require("./routes/mistakeRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const revisionRoutes = require("./routes/revisionRoutes");
const mockExamRoutes = require("./routes/mockExamRoutes");
const predictionRoutes = require("./routes/predictionRoutes");

// Jobs
const { startTaskScheduler } = require("./jobs/taskScheduler");

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Auth
app.use("/api/auth", authRoutes);

// User & subjects
app.use("/api/users", userRoutes);
app.use("/api/users", subjectRoutes); // /api/users/subjects, /api/users/select, /api/users/subject

// Topics & learning
app.use("/api/topics", topicRoutes);
app.use("/api/learning", learningRoutes);
app.use("/api/learning-state", learningStateRoutes);

// Study plan, tasks, sessions
app.use("/api/study-plans", studyPlanRoutes);
app.use("/api/study-sessions", studySessionsRoutes);
app.use("/api/study-tasks", studyTaskRoutes); // ← was missing from app.js

// Quiz & intelligence layer
app.use("/api/quiz", quizRoutes);
app.use("/api/mistakes", mistakeRoutes);

// Analytics, revision, mock exams, predictions
app.use("/api/analytics", analyticsRoutes);
app.use("/api/revision", revisionRoutes);
app.use("/api/mock", mockExamRoutes);
app.use("/api/prediction", predictionRoutes);

// Start cron jobs
startTaskScheduler();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ LEARNVIS Server running on port ${PORT}`);
});
