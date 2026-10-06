// ============================================
// URL SCANNER CONTROLLER
// ============================================

const {
  scanUrl,
} = require("../services/urlScannerService");

const {
  saveScanHistory,
} = require("../services/scanHistoryService");

// ============================================
// SCAN URL
// ============================================

async function scanUrlController(req, res) {
  try {
    const { url, userId } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: "URL is required",
      });
    }

    // Run URL scanner
    const result = await scanUrl(url);

    // Save scan history
    let history = null;

    try {
      history = await saveScanHistory({
        userId: userId || null,
        scanType: "url",
        content: url,
        result,
      });
    } catch (historyError) {
      console.error(
        "History save failed:",
        historyError.message
      );
    }

    return res.status(200).json({
      success: true,
      message: "URL scanned successfully",
      data: result,
      historySaved: !!history,
      historyId: history?.id || null,
    });
  } catch (error) {
    console.error(
      "URL Scanner Error:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Unable to scan URL",
    });
  }
}

module.exports = {
  scanUrlController,
};