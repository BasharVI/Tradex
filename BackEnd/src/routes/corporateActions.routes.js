const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middleware/validate");
const requireAuth = require("../middleware/auth");
const { corporateActionSchema } = require("../validators/trade.schema");
const svc = require("../services/corporateActions.service");

const router = express.Router();
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json({ actions: await svc.listScheduled() });
  })
);

// Admin: schedule a new action.
router.post(
  "/",
  validate(corporateActionSchema),
  asyncHandler(async (req, res) => {
    if (req.headers["x-admin-token"] !== process.env.ADMIN_TOKEN) {
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "Admin only" } });
    }
    res.status(201).json({ action: await svc.scheduleAction(req.body) });
  })
);

// Admin: apply a scheduled action.
router.post(
  "/:id/apply",
  asyncHandler(async (req, res) => {
    if (req.headers["x-admin-token"] !== process.env.ADMIN_TOKEN) {
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "Admin only" } });
    }
    res.json(await svc.applyAction(req.params.id));
  })
);

module.exports = router;
