const mongoose = require("mongoose");
const Order = require("../models/Order");
const Trade = require("../models/Trade");
const Holding = require("../models/Holding");
const StockMaster = require("../models/StockMaster");
const User = require("../models/User");
const FundLedger = require("../models/FundLedger");
const AppError = require("../utils/AppError");
const { calculateCharges, netCashFlow } = require("./charges.service");
const { postEntry } = require("./ledger.service");

const round2 = (n) => Math.round(n * 100) / 100;

// MARKET orders simulate an instant fill at LTP. LIMIT orders fill instantly if
// the LTP already crosses the limit, otherwise stay PENDING. A real broker
// would queue them against the live book; this matches paper-trading behavior.
async function placeOrder(userId, payload) {
  const {
    symbol,
    exchange,
    side,
    orderType,
    productType,
    quantity,
    limitPrice,
  } = payload;

  const stock = await StockMaster.findOne({ symbol, exchange, isActive: true });
  if (!stock) {
    throw new AppError(
      `Symbol ${symbol} not listed on ${exchange}`,
      404,
      "UNKNOWN_SYMBOL"
    );
  }
  if (!stock.isTradable) {
    throw new AppError("Symbol is not currently tradable", 400, "NOT_TRADABLE");
  }
  if (!stock.lastPrice || stock.lastPrice <= 0) {
    throw new AppError(
      "No reference price available for symbol",
      400,
      "NO_PRICE"
    );
  }

  // Lot-size guard: NSE/BSE quote a min lot per symbol; F&O matters less here
  // but the schema carries lotSize so we honour it.
  if (quantity % stock.lotSize !== 0) {
    throw new AppError(
      `Quantity must be a multiple of lot size ${stock.lotSize}`,
      400,
      "INVALID_LOT"
    );
  }

  // Decide on an execution price.
  let executionPrice = stock.lastPrice;
  let willFill = true;
  if (orderType === "LIMIT") {
    if (!limitPrice || limitPrice <= 0) {
      throw new AppError("LIMIT order requires a positive price", 400, "BAD_PRICE");
    }
    // BUY fills when LTP <= limit; SELL fills when LTP >= limit. Otherwise the
    // order parks as PENDING — a future quote tick would trigger it.
    if (side === "BUY") {
      willFill = stock.lastPrice <= limitPrice;
      executionPrice = Math.min(stock.lastPrice, limitPrice);
    } else {
      willFill = stock.lastPrice >= limitPrice;
      executionPrice = Math.max(stock.lastPrice, limitPrice);
    }
  }

  const order = await Order.create({
    userId,
    symbol,
    exchange,
    side,
    orderType,
    productType,
    quantity,
    limitPrice: orderType === "LIMIT" ? limitPrice : null,
    status: "PENDING",
  });

  if (!willFill) {
    // Park unfilled LIMIT order. Caller can poll/cancel.
    return { order, trade: null };
  }

  try {
    const trade = await executeFill(order, executionPrice);
    return { order: trade.orderRefreshed, trade: trade.tradeDoc };
  } catch (err) {
    await Order.updateOne(
      { _id: order._id },
      { $set: { status: "REJECTED", rejectionReason: err.message } }
    );
    throw err;
  }
}

async function executeFill(order, price) {
  const charges = calculateCharges({
    side: order.side,
    productType: order.productType,
    exchange: order.exchange,
    price,
    quantity: order.quantity,
  });
  const netAmount = netCashFlow({ side: order.side, charges });

  // Use a transaction when available; falls back to non-transactional writes
  // for single-node Mongo deployments where transactions aren't supported.
  const session = await tryStartSession();

  try {
    if (session) session.startTransaction();

    let realizedPnL = 0;
    if (order.side === "BUY") {
      await applyBuyFill(order, price, charges, netAmount, session);
    } else {
      realizedPnL = await applySellFill(order, price, charges, netAmount, session);
    }

    const tradeArr = await Trade.create(
      [
        {
          userId: order.userId,
          orderId: order._id,
          symbol: order.symbol,
          exchange: order.exchange,
          side: order.side,
          productType: order.productType,
          quantity: order.quantity,
          price: round2(price),
          turnover: charges.turnover,
          charges,
          netAmount,
          realizedPnL: round2(realizedPnL),
        },
      ],
      session ? { session } : undefined
    );

    const orderUpd = await Order.findOneAndUpdate(
      { _id: order._id },
      {
        $set: {
          status: "EXECUTED",
          filledQuantity: order.quantity,
          avgFillPrice: round2(price),
          executedAt: new Date(),
        },
      },
      { new: true, ...(session ? { session } : {}) }
    );

    if (session) await session.commitTransaction();
    return { tradeDoc: tradeArr[0], orderRefreshed: orderUpd };
  } catch (err) {
    if (session) await session.abortTransaction();
    throw err;
  } finally {
    if (session) session.endSession();
  }
}

async function applyBuyFill(order, price, charges, netAmount, session) {
  // Debit cash + write ledger atomically.
  await postEntry({
    userId: order.userId,
    amount: netAmount, // negative for BUY
    type: "TRADE_BUY",
    description: `BUY ${order.quantity} ${order.symbol} @ ${price}`,
    referenceType: "Order",
    referenceId: order._id,
    session,
  });

  // Brokerage/tax sub-entries — book-keeping rows so the user sees costs in
  // the ledger view. They net to zero with the BUY entry's all-in netAmount.
  await postChargeBreakdown(order, charges, session);

  // Upsert holding with weighted-average pricing. investedAmount tracks gross
  // (price * qty); charges are recognised separately in the ledger.
  const cost = round2(price * order.quantity);
  await Holding.findOneAndUpdate(
    {
      userId: order.userId,
      symbol: order.symbol,
      exchange: order.exchange,
      productType: order.productType,
    },
    [
      {
        $set: {
          quantity: {
            $add: [{ $ifNull: ["$quantity", 0] }, order.quantity],
          },
          investedAmount: {
            $add: [{ $ifNull: ["$investedAmount", 0] }, cost],
          },
          lastPrice: price,
          lastTradedAt: new Date(),
          openedAt: { $ifNull: ["$openedAt", new Date()] },
          userId: order.userId,
          symbol: order.symbol,
          exchange: order.exchange,
          productType: order.productType,
        },
      },
      {
        $set: {
          averagePrice: {
            $cond: [
              { $eq: ["$quantity", 0] },
              0,
              { $divide: ["$investedAmount", "$quantity"] },
            ],
          },
        },
      },
    ],
    { upsert: true, new: true, ...(session ? { session } : {}) }
  );

  // CNC tracks user.investedAmount for capital reporting. MIS is intraday and
  // doesn't lock capital in the long-term invested bucket.
  if (order.productType === "CNC") {
    await User.updateOne(
      { _id: order.userId },
      { $inc: { investedAmount: cost } },
      session ? { session } : undefined
    );
  }
}

async function applySellFill(order, price, charges, netAmount, session) {
  const holding = await Holding.findOne({
    userId: order.userId,
    symbol: order.symbol,
    exchange: order.exchange,
    productType: order.productType,
  }).session(session || null);

  if (!holding || holding.quantity < order.quantity) {
    throw new AppError(
      "Insufficient holding to sell",
      400,
      "INSUFFICIENT_QUANTITY"
    );
  }

  // FIFO/avg-cost realized P&L: (sell - avg) * qty.
  const realizedPnL = round2((price - holding.averagePrice) * order.quantity);
  const investedReleased = round2(holding.averagePrice * order.quantity);

  await postEntry({
    userId: order.userId,
    amount: netAmount, // positive for SELL
    type: "TRADE_SELL",
    description: `SELL ${order.quantity} ${order.symbol} @ ${price}`,
    referenceType: "Order",
    referenceId: order._id,
    session,
  });
  await postChargeBreakdown(order, charges, session);

  const remainingQty = holding.quantity - order.quantity;
  if (remainingQty === 0) {
    await Holding.deleteOne(
      { _id: holding._id },
      session ? { session } : undefined
    );
  } else {
    // Avg price unchanged on partial sell; invested falls by avg * sold.
    await Holding.updateOne(
      { _id: holding._id },
      {
        $set: {
          quantity: remainingQty,
          investedAmount: round2(holding.investedAmount - investedReleased),
          lastPrice: price,
          lastTradedAt: new Date(),
        },
      },
      session ? { session } : undefined
    );
  }

  if (order.productType === "CNC") {
    await User.updateOne(
      { _id: order.userId },
      {
        $inc: {
          investedAmount: -investedReleased,
          realizedPnL,
        },
      },
      session ? { session } : undefined
    );
  } else {
    await User.updateOne(
      { _id: order.userId },
      { $inc: { realizedPnL } },
      session ? { session } : undefined
    );
  }

  return realizedPnL;
}

// Emit zero-sum, view-only sub-entries so the FundLedger reflects each charge
// separately for the audit/UI. They don't move cash — TRADE_BUY/SELL already
// captured the net impact above.
async function postChargeBreakdown(order, charges, session) {
  const rows = [];
  const base = {
    userId: order.userId,
    referenceType: "Order",
    referenceId: order._id,
    balanceAfter: 0, // overwritten just before insert
  };
  if (charges.brokerage > 0) {
    rows.push({ ...base, type: "BROKERAGE", amount: 0, description: `Brokerage ${order.symbol}` });
  }
  if (charges.stt + charges.gst + charges.sebiCharges + charges.stampDuty + charges.exchangeTxnCharges > 0) {
    rows.push({
      ...base,
      type: "TAX",
      amount: 0,
      description: `STT/GST/Exchange/SEBI/Stamp on ${order.symbol}`,
    });
  }
  if (rows.length === 0) return;

  // Reflect the post-trade balance for visual clarity.
  const u = await User.findById(order.userId)
    .select("availableCash")
    .session(session || null);
  rows.forEach((r) => (r.balanceAfter = round2(u.availableCash)));

  await FundLedger.insertMany(rows, session ? { session } : undefined);
}

async function tryStartSession() {
  try {
    const session = await mongoose.startSession();
    return session;
  } catch {
    return null;
  }
}

async function cancelOrder(userId, orderId) {
  const order = await Order.findOne({ _id: orderId, userId });
  if (!order) throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
  if (order.status !== "PENDING") {
    throw new AppError("Only PENDING orders can be cancelled", 400, "BAD_STATE");
  }
  order.status = "CANCELLED";
  await order.save();
  return order;
}

module.exports = { placeOrder, executeFill, cancelOrder };
