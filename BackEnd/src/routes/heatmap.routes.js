const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const requireAuth = require("../middleware/auth");
const { holdingsHeatmap, sectorHeatmap } = require("../services/heatmap.service");

const router = express.Router();
router.use(requireAuth);

router.get(
  "/holdings",
  asyncHandler(async (req, res) => {
    res.json({ cells: await holdingsHeatmap(req.userId) });
  })
);

router.get(
  "/sector",
  asyncHandler(async (req, res) => {
    res.json({ cells: await sectorHeatmap(req.userId) });
  })
);

module.exports = router;
