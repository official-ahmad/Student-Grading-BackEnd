const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  generateRecommendations,
  getStudentRecommendations,
} = require("../services/recommendationService");

const router = express.Router();

// @route   GET /api/recommendations
// @desc    Get all student recommendations
// @access  Private
router.get("/", protect, async (req, res) => {
  try {
    const recommendations = await generateRecommendations();

    const { riskLevel, sortBy = "riskLevel" } = req.query;

    let filtered = recommendations;

    // Filter by risk level if provided
    if (riskLevel) {
      filtered = filtered.filter((rec) => rec.riskLevel === riskLevel);
    }

    // Sort
    if (sortBy === "name") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "percentage") {
      filtered.sort((a, b) => b.percentage - a.percentage);
    } else {
      // Sort by risk level
      const riskOrder = {
        Critical: 0,
        High: 1,
        Medium: 2,
        Low: 3,
        Excellent: 4,
      };
      filtered.sort((a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel]);
    }

    res.json({
      total: filtered.length,
      data: filtered,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// @route   GET /api/recommendations/student/:id
// @desc    Get recommendations for a specific student
// @access  Private
router.get("/student/:id", protect, async (req, res) => {
  try {
    const recommendations = await getStudentRecommendations(req.params.id);
    res.json(recommendations);
  } catch (error) {
    res
      .status(error.message.includes("not found") ? 404 : 500)
      .json({ message: error.message });
  }
});

// @route   GET /api/recommendations/summary
// @desc    Get summary of all recommendations
// @access  Private
router.get("/summary/stats", protect, async (req, res) => {
  try {
    const recommendations = await generateRecommendations();

    const summary = {
      total: recommendations.length,
      byRiskLevel: {
        Critical: recommendations.filter((r) => r.riskLevel === "Critical")
          .length,
        High: recommendations.filter((r) => r.riskLevel === "High").length,
        Medium: recommendations.filter((r) => r.riskLevel === "Medium").length,
        Low: recommendations.filter((r) => r.riskLevel === "Low").length,
        Excellent: recommendations.filter((r) => r.riskLevel === "Excellent")
          .length,
      },
      averagePercentage: (
        recommendations.reduce((sum, r) => sum + r.percentage, 0) /
        recommendations.length
      ).toFixed(2),
      needsAttention: recommendations.filter(
        (r) => r.riskLevel === "Critical" || r.riskLevel === "High",
      ).length,
    };

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

module.exports = router;
