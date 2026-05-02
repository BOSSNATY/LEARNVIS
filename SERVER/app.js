const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const quizRoutes = require("./routes/quizRoutes");
const userRoutes = require("./routes/userRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const learningStateRoutes = require("./routes/learningStateRoutes");
const topicRoutes = require("./routes/topicRoutes");
const learningRoutes = require("./routes/learningRoutes");

require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/users", subjectRoutes);
app.use("/api/learningState", learningStateRoutes);
app.use("/api/topics", topicRoutes);
app.use("/api/learning", learningRoutes);
app.use("/api/quiz", quizRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
