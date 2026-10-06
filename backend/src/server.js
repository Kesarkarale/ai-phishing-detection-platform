const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

const supabase = require("./config/supabase");
const urlScannerRoutes = require("./routes/urlScannerRoutes");

const emailAnalyzerRoutes =
  require("./routes/emailAnalyzerRoutes");

const scanHistoryRoutes =
  require("./routes/scanHistoryRoutes");

const dashboardRoutes =
  require("./routes/dashboardRoutes");

const app = express();

// ================================
// MIDDLEWARE
// ================================

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(morgan("dev"));

// ================================
// ROUTES
// ================================

app.use("/api/scanner", urlScannerRoutes);

app.use(
  "/api/analyzer",
  emailAnalyzerRoutes
);

app.use(
  "/api/history",
  scanHistoryRoutes
);

app.use(
  "/api/dashboard",
  dashboardRoutes
);

// ================================
// HEALTH CHECK
// ================================

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "AI Phishing Detection API is running",
  });
});

// ================================
// SUPABASE HEALTH CHECK
// ================================

app.get("/api/health/supabase", async (req, res) => {
  try {
    const { error } = await supabase
      .from("scan_history")
      .select("id")
      .limit(1);

    if (error) {
      console.error("Supabase error:", error);

      return res.status(500).json({
        success: false,
        message: "Supabase connection failed",
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Backend connected to Supabase successfully",
    });
  } catch (error) {
    console.error("Connection error:", error);

    return res.status(500).json({
      success: false,
      message: "Supabase connection failed",
      error: error.message,
    });
  }
});

// ================================
// 404 HANDLER
// ================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ================================
// SERVER
// ================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("========================================");
  console.log(`Backend running on http://localhost:${PORT}`);
  console.log("URL Scanner: POST /api/scanner/url");
  console.log("========================================");
});