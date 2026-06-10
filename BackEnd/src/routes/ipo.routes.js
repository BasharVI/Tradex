const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middleware/validate");
const requireAuth = require("../middleware/auth");
const { ipoSubscribeSchema } = require("../validators/trade.schema");
const ipoService = require("../services/ipo.service");

const router = express.Router();
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    res.json({ ipos: await ipoService.listIPOs(filter) });
  })
);

router.get(
  "/my",
  asyncHandler(async (req, res) => {
    res.json({ subscriptions: await ipoService.mySubscriptions(req.userId) });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    res.json({ ipo: await ipoService.getIPO(req.params.id) });
  })
);

router.post(
  "/:id/subscribe",
  validate(ipoSubscribeSchema),
  asyncHandler(async (req, res) => {
    const sub = await ipoService.subscribe(req.userId, req.params.id, req.body);
    res.status(201).json({ subscription: sub });
  })
);

// Admin-style endpoints — gated by ADMIN_TOKEN in env. In a real deployment
// you'd separate these from the user-facing API entirely.
router.post(
  "/:id/allot",
  asyncHandler(async (req, res) => {
    if (req.headers["x-admin-token"] !== process.env.ADMIN_TOKEN) {
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "Admin only" } });
    }
    res.json(await ipoService.runAllotment(req.params.id));
  })
);

router.post(
  "/:id/list",
  asyncHandler(async (req, res) => {
    if (req.headers["x-admin-token"] !== process.env.ADMIN_TOKEN) {
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "Admin only" } });
    }
    const ipo = await ipoService.markListed(req.params.id, Number(req.body.listingPrice));
    res.json({ ipo });
  })
);

module.exports = router;
