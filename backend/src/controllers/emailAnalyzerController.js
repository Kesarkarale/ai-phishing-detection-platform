// ============================================
// EMAIL ANALYZER CONTROLLER
// ============================================

const {
  analyzeEmail,
} = require("../services/emailAnalyzerService");

const {
  saveScanHistory,
} = require("../services/scanHistoryService");

// ============================================
// ANALYZE EMAIL
// ============================================

async function analyzeEmailController(
  req,
  res
) {
  try {
    const {
      emailContent,
      userId,
    } = req.body;

    if (!emailContent) {
      return res.status(400).json({
        success: false,
        message:
          "Email content is required",
      });
    }

    // Analyze email
    const result =
      analyzeEmail(emailContent);

    // Save scan history
    let history = null;

    try {
      history = await saveScanHistory({
        userId: userId || null,
        scanType: "email",
        content: emailContent,
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
      message:
        "Email analyzed successfully",
      data: result,
      historySaved: !!history,
      historyId: history?.id || null,
    });
  } catch (error) {
    console.error(
      "Email Analyzer Error:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Unable to analyze email",
    });
  }
}

module.exports = {
  analyzeEmailController,
};