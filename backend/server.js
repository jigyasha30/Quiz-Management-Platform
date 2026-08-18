const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

// ==========================================
// CONFIGURATION
// ==========================================
dotenv.config();

// ==========================================
// DATABASE
// ==========================================
const connectDB = require("./config/db");

// ==========================================
// ROUTES
// ==========================================
const authRoutes = require("./routes/authRoutes");
const quizRoutes = require("./routes/quizRoutes");
const attemptRoutes = require("./routes/attemptRoutes");
const adminRoutes = require("./routes/adminRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const questionRoutes = require("./routes/questionRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");
const userRoutes = require("./routes/userRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");

// ==========================================
// APP INITIALIZATION
// ==========================================
const app = express();

// ==========================================
// CONNECT DATABASE
// ==========================================
connectDB();

// ==========================================
// MIDDLEWARE
// ==========================================
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// ROOT ROUTE
// ==========================================
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "QuizMaster API is running 🚀",
  });
});

// ==========================================
// API ROUTES
// ==========================================

// ------------------------------------------
// Authentication
// ------------------------------------------
app.use("/api/auth", authRoutes);

// ------------------------------------------
// Quiz Management
// ------------------------------------------
app.use("/api/quizzes", quizRoutes);

// ------------------------------------------
// Quiz Attempts
// ------------------------------------------
app.use("/api/attempts", attemptRoutes);

// ------------------------------------------
// Admin Dashboard
// ------------------------------------------
app.use("/api/admin", adminRoutes);

// ------------------------------------------
// Category Management
// ------------------------------------------
app.use("/api/categories", categoryRoutes);

// ------------------------------------------
// Question Management
// ------------------------------------------
app.use("/api/questions", questionRoutes);

// ------------------------------------------
// Leaderboard
// ------------------------------------------
app.use("/api/leaderboard", leaderboardRoutes);

// ------------------------------------------
// User Management
// ------------------------------------------
app.use("/api/users", userRoutes);

// ------------------------------------------
// Admin Analytics
// ------------------------------------------
app.use("/api/analytics", analyticsRoutes);

// ==========================================
// 404 ROUTE
// ==========================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================
app.use((err, req, res, next) => {
  console.error("❌ Error:", err);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ==========================================
// SERVER
// ==========================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `🚀 QuizMaster API running on http://localhost:${PORT}`
  );
});