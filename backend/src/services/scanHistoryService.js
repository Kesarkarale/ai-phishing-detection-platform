// ============================================
// SCAN HISTORY SERVICE
// ============================================

const supabase = require("../config/supabase");

// ============================================
// SAVE SCAN HISTORY
// ============================================

async function saveScanHistory({
  userId = null,
  scanType,
  content,
  result,
}) {
  try {
    if (!scanType) {
      throw new Error("Scan type is required");
    }

    if (!content) {
      throw new Error("Scan content is required");
    }

    if (!result) {
      throw new Error("Scan result is required");
    }

    const historyRecord = {
      scan_type: scanType,
      content,
      result,
      risk_score: result.riskScore,
      risk_level: result.riskLevel,
    };

    // Add user_id only when we actually have one.
    // During current backend testing, authentication
    // is not connected yet.
    if (userId) {
      historyRecord.user_id = userId;
    }

    const { data, error } = await supabase
      .from("scan_history")
      .insert([historyRecord])
      .select()
      .single();

    if (error) {
      console.error(
        "Save Scan History Error:",
        error
      );

      throw new Error(
        "Unable to save scan history"
      );
    }

    return data;
  } catch (error) {
    console.error(
      "Scan History Service Error:",
      error
    );

    throw error;
  }
}

module.exports = {
  saveScanHistory,
};

async function getScanHistory({
  userId = null,
  scanType = null,
  limit = 20,
}) {
  try {
    let query = supabase
      .from("scan_history")
      .select(
        "id, user_id, scan_type, content, result, risk_score, risk_level, created_at"
      )
      .order("created_at", {
        ascending: false,
      })
      .limit(limit);

    // When authentication is connected,
    // we can filter by logged-in user.
    if (userId) {
      query = query.eq("user_id", userId);
    }

    // Optional URL / Email filter
    if (scanType) {
      query = query.eq(
        "scan_type",
        scanType
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error(
        "Get Scan History Error:",
        error
      );

      throw new Error(
        "Unable to fetch scan history"
      );
    }

    return data || [];
  } catch (error) {
    console.error(
      "Scan History Fetch Service Error:",
      error
    );

    throw error;
  }
}

module.exports = {
  saveScanHistory,
  getScanHistory,
};