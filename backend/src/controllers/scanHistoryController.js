// ============================================
// SCAN HISTORY CONTROLLER
// ============================================

const {
  getScanHistory,
} = require("../services/scanHistoryService");

// ============================================
// GET SCAN HISTORY
// ============================================

async function getScanHistoryController(
  req,
  res
) {
  try {
    const {
      userId,
      scanType,
      limit,
    } = req.query;

    let parsedLimit = 20;

    if (limit) {
      parsedLimit =
        parseInt(limit, 10);
    }

    // Keep limit within safe range
    parsedLimit = Math.min(
      Math.max(parsedLimit, 1),
      100
    );

    const history =
      await getScanHistory({
        userId:
          userId || null,

        scanType:
          scanType || null,

        limit:
          parsedLimit,
      });

    return res.status(200).json({
      success: true,
      message:
        "Scan history fetched successfully",

      count: history.length,

      data: history,
    });
  } catch (error) {
    console.error(
      "Get Scan History Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to fetch scan history",
    });
  }
}

module.exports = {
  getScanHistoryController,
};