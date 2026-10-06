const express = require("express");

const {
  scanUrlController,
} = require("../controllers/urlScannerController");

const router = express.Router();

router.post("/url", scanUrlController);

module.exports = router;