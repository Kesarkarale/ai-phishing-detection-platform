const express = require("express");

const {
  getScanHistoryController,
} = require("../controllers/scanHistoryController");

const router = express.Router();

// GET /api/history
router.get(
  "/",
  getScanHistoryController
);

module.exports = router;