// One-shot v2 -> v3 migration. Idempotent.
//
// What it does, for every existing user document:
//   1. Backfill capital fields (startingCapital, availableCash, investedAmount,
//      realizedPnL, unrealizedPnL).
//      - If the doc still carries the legacy `fund` field, treat it as
//        availableCash and seed a DEPOSIT ledger row.
//   2. Move embedded portfolio[] into the Holding collection (productType CNC).
//   3. Move embedded orderHistory[] into the Order + Trade collections.
//   4. Convert embedded watchlist[] symbols to (symbol, exchange) form,
//      defaulting exchange to NSE.
//   5. Ensure every legacy symbol has a StockMaster row (placeholder if unknown).
//   6. Strip legacy embedded arrays from the user document.
//
//   node src/scripts/migrate-v3.js [--dry-run]

const mongoose = require("mongoose");
const { connectDb } = require("../config/db");
const User = require("../models/User");
const Holding = require("../models/Holding");
const Order = require("../models/Order");
const Trade = require("../models/Trade");
const FundLedger = require("../models/FundLedger");
const StockMaster = require("../models/StockMaster");

const DRY = process.argv.includes("--dry-run");
const STARTING_CAPITAL = Number(process.env.STARTING_CAPITAL || 1_000_000);
const round2 = (n) => Math.round(n * 100) / 100;

async function ensureStockMaster(symbol) {
  const found = await StockMaster.findOne({ symbol, exchange: "NSE" });
  if (found) return found;
  if (DRY) return null;
  return StockMaster.create({
    symbol,
    companyName: symbol,
    exchange: "NSE",
    sector: "UNCATEGORIZED",
    industry: "UNCATEGORIZED",
    lotSize: 1,
    isActive: true,
  });
}

async function migrateUser(userDoc) {
  const u = userDoc.toObject();
  const id = u._id;
  console.log(`\n[migrate] user=${u.email || id}`);

  const updates = {};
  const unset = {};

  // 1. Capital.
  if (u.startingCapital == null) {
    updates.startingCapital = STARTING_CAPITAL;
  }
  if (u.availableCash == null) {
    const fundBalance = Number(u.fund) || 0;
    updates.availableCash = fundBalance > 0 ? fundBalance : STARTING_CAPITAL;
  }
  if (u.investedAmount == null) updates.investedAmount = 0;
  if (u.realizedPnL == null) updates.realizedPnL = 0;
  if (u.unrealizedPnL == null) updates.unrealizedPnL = 0;

  // 2. Holdings.
  if (Array.isArray(u.portfolio) && u.portfolio.length > 0) {
    let invested = 0;
    for (const p of u.portfolio) {
      await ensureStockMaster(p.symbol);
      const total = round2((p.totalInvested ?? p.averagePrice * p.quantity) || 0);
      const avg = round2(p.averagePrice ?? p.boughtPrice ?? 0);
      invested += total;
      console.log(`  holding ${p.symbol} qty=${p.quantity} avg=${avg}`);
      if (DRY) continue;
      await Holding.findOneAndUpdate(
        { userId: id, symbol: p.symbol, exchange: "NSE", productType: "CNC" },
        {
          $setOnInsert: {
            quantity: p.quantity,
            averagePrice: avg,
            investedAmount: total,
            lastPrice: p.currentPrice || avg,
            openedAt: p.lastUpdate || new Date(),
            lastTradedAt: p.lastUpdate || new Date(),
          },
        },
        { upsert: true, new: true }
      );
    }
    updates.investedAmount = round2(invested);
    unset.portfolio = "";
  }

  // 3. Orders + Trades. Idempotent: skip if an order with the same
  // (userId, symbol, placedAt, quantity, side) already exists.
  if (Array.isArray(u.orderHistory) && u.orderHistory.length > 0) {
    for (const o of u.orderHistory) {
      const side = String(o.orderType).toUpperCase() === "SELL" ? "SELL" : "BUY";
      const turnover = round2(o.orderPrice * o.quantity);
      const placedAt = o.orderDate || new Date();
      console.log(`  order ${side} ${o.symbol} qty=${o.quantity} @ ${o.orderPrice}`);
      if (DRY) continue;

      const existing = await Order.findOne({
        userId: id,
        symbol: o.symbol,
        placedAt,
        quantity: o.quantity,
        side,
      });
      if (existing) {
        console.log("    -> already migrated, skipping");
        continue;
      }
      const order = await Order.create({
        userId: id,
        symbol: o.symbol,
        exchange: "NSE",
        side,
        orderType: "MARKET",
        productType: "CNC",
        quantity: o.quantity,
        limitPrice: null,
        avgFillPrice: o.orderPrice,
        filledQuantity: o.quantity,
        status: "EXECUTED",
        placedAt,
        executedAt: placedAt,
      });
      await Trade.create({
        userId: id,
        orderId: order._id,
        symbol: o.symbol,
        exchange: "NSE",
        side,
        productType: "CNC",
        quantity: o.quantity,
        price: o.orderPrice,
        turnover,
        charges: { brokerage: 0, stt: 0, exchangeTxnCharges: 0, gst: 0, sebiCharges: 0, stampDuty: 0, total: 0 },
        netAmount: side === "BUY" ? -turnover : turnover,
        realizedPnL: 0,
        executedAt: placedAt,
      });
    }
    unset.orderHistory = "";
  }

  // 4. Watchlist.
  if (Array.isArray(u.watchlist) && u.watchlist.length > 0) {
    const cleaned = [];
    for (const w of u.watchlist) {
      await ensureStockMaster(w.symbol);
      cleaned.push({
        symbol: w.symbol,
        exchange: "NSE",
        addedAt: w.lastUpdate || new Date(),
      });
    }
    updates.watchlist = cleaned;
  }

  // 5. Opening DEPOSIT ledger (only if no ledger entries exist yet).
  if (!DRY) {
    const existingLedger = await FundLedger.countDocuments({ userId: id });
    if (existingLedger === 0) {
      const opening =
        updates.availableCash != null ? updates.availableCash : u.availableCash || STARTING_CAPITAL;
      await FundLedger.create({
        userId: id,
        type: "DEPOSIT",
        amount: opening,
        balanceAfter: opening,
        description: "Migrated opening balance",
      });
    }
  }

  // 6. Drop legacy `fund` from the doc.
  if ("fund" in u) unset.fund = "";

  if (!DRY) {
    const $set = Object.keys(updates).length ? updates : undefined;
    const $unset = Object.keys(unset).length ? unset : undefined;
    if ($set || $unset) {
      const op = {};
      if ($set) op.$set = $set;
      if ($unset) op.$unset = $unset;
      await User.updateOne({ _id: id }, op);
    }
  }
  console.log("  done");
}

(async () => {
  await connectDb();
  console.log(`[migrate] DRY_RUN=${DRY}`);
  const cursor = User.find({}).cursor();
  let count = 0;
  for await (const u of cursor) {
    await migrateUser(u);
    count += 1;
  }
  console.log(`\n[migrate] processed ${count} users`);
  await mongoose.disconnect();
  process.exit(0);
})().catch((err) => {
  console.error("[migrate] failed:", err);
  process.exit(1);
});
