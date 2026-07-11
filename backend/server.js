require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const seedDefaultAdmin = require("./utils/seedAdmin");

const publicRoutes = require("./routes/publicRoutes");
const authRoutes = require("./routes/authRoutes");
const leadRoutes = require("./routes/leadRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
app.use(express.json({ limit: "10kb" }));

const allowedOrigin = process.env.CLIENT_ORIGIN || "http://127.0.0.1:5500";
app.use(cors({ origin: allowedOrigin }));

// --- Database + seed default admin ---
(async () => {
  await connectDB();
  await seedDefaultAdmin();
})();

// --- Routes ---
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "ok",
    data: {
      dbConnected: mongoose.connection.readyState === 1,
      timestamp: new Date().toISOString(),
    },
  });
});

app.use("/api/public", publicRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/leads", leadRoutes);

// --- 404 handler ---
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found." });
});

// --- Global error handler ---
app.use((err, req, res, next) => {
  console.error("❌ Unhandled error:", err);
  res.status(500).json({ success: false, message: "Internal server error." });
});

app.listen(PORT, () => {
  console.log(`🚀 Mini CRM backend running on http://localhost:${PORT}`);
  console.log(`   CORS allowed origin: ${allowedOrigin}`);
});
