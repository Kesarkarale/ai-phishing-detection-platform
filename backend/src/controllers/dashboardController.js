// ============================================
// DASHBOARD CONTROLLER
// ============================================

const supabase = require("../config/supabase");

// ============================================
// GET DASHBOARD STATISTICS
// ============================================

async function getDashboardStats(
  req,
  res
) {
  try {
    const { userId } = req.query;

    let query = supabase
      .from("scan_history")
      .select(
        "id, scan_type, risk_score, risk_level, created_at, user_id"
      );

    if (userId) {
      query = query.eq(
        "user_id",
        userId
      );
    }

    const {
      data,
      error,
    } = await query;

    if (error) {
      console.error(
        "Dashboard Stats Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to fetch dashboard statistics",
      });
    }

    const scans = data || [];

    const totalScans =
      scans.length;

    const urlScans =
      scans.filter(
        (scan) =>
          scan.scan_type === "url"
      ).length;

    const emailScans =
      scans.filter(
        (scan) =>
          scan.scan_type === "email"
      ).length;

    const highRisk =
      scans.filter(
        (scan) =>
          scan.risk_level === "HIGH"
      ).length;

    const mediumRisk =
      scans.filter(
        (scan) =>
          scan.risk_level === "MEDIUM"
      ).length;

    const lowRisk =
      scans.filter(
        (scan) =>
          scan.risk_level === "LOW"
      ).length;

    return res.status(200).json({
      success: true,

      data: {
        totalScans,
        urlScans,
        emailScans,

        risk: {
          high: highRisk,
          medium: mediumRisk,
          low: lowRisk,
        },

        recentScans:
          scans
            .sort(
              (a, b) =>
                new Date(
                  b.created_at
                ) -
                new Date(
                  a.created_at
                )
            )
            .slice(0, 5),
      },
    });
  } catch (error) {
    console.error(
      "Dashboard Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load dashboard",
    });
  }
}

module.exports = {
  getDashboardStats,
};