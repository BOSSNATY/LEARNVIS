const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const learningRoutes = require("./routes/learningRoutes");
const quizRoutes = require("./routes/quizRoutes");
const userRoutes = require("./routes/userRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
// app.use("/api/auth", authRoutes);
// app.use("/api/learning", learningRoutes);
// app.use("/api/quiz", quizRoutes);
app.use("/api/users", userRoutes);
app.use("/api/users", subjectRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
