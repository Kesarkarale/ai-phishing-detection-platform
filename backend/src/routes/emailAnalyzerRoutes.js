const express = require("express");

const {
  analyzeEmailController,
} = require("../controllers/emailAnalyzerController");

const router = express.Router();

router.post(
  "/email",
  analyzeEmailController
);

module.exports = router;