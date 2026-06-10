const express = require("express");
const Order = require("../models/Order");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middleware/validate");
const requireAuth = require("../middleware/auth");
const { placeOrderSchema } = require("../validators/trade.schema");
const { placeOrder, cancelOrder } = require("../services/trading.service");

const router = express.Router();
router.use(requireAuth);

// List my orders.
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const orders = await Order.find({ userId: req.userId })
      .sort({ placedAt: -1 })
      .limit(200)
      .lean();
    res.json({ orders });
  })
);

// Place a new order.
router.post(
  "/",
  validate(placeOrderSchema),
  asyncHandler(async (req, res) => {
    const { order, trade } = await placeOrder(req.userId, req.body);
    res.status(201).json({ order, trade });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const order = await Order.findOne({ _id: req.params.id, userId: req.userId }).lean();
    if (!order) throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
    res.json({ order });
  })
);

router.post(
  "/:id/cancel",
  asyncHandler(async (req, res) => {
    const order = await cancelOrder(req.userId, req.params.id);
    res.json({ order });
  })
);

module.exports = router;
