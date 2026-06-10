const IPO = require("../models/IPO");
const IPOSubscription = require("../models/IPOSubscription");
const Holding = require("../models/Holding");
const StockMaster = require("../models/StockMaster");
const AppError = require("../utils/AppError");
const { postEntry } = require("./ledger.service");

const round2 = (n) => Math.round(n * 100) / 100;

async function listIPOs(filter = {}) {
  return IPO.find(filter).sort({ openDate: -1 }).lean();
}

async function getIPO(ipoId) {
  const ipo = await IPO.findById(ipoId).lean();
  if (!ipo) throw new AppError("IPO not found", 404, "NOT_FOUND");
  return ipo;
}

// Subscribe: bid for `lots` lots at `bidPrice`. Funds are blocked (debited)
// via ledger now and either applied (on allotment) or refunded (on non-
// allotment), mirroring real ASBA behavior.
async function subscribe(userId, ipoId, { lots, bidPrice, category = "RETAIL" }) {
  const ipo = await IPO.findById(ipoId);
  if (!ipo) throw new AppError("IPO not found", 404, "NOT_FOUND");
  if (!["UPCOMING", "OPEN"].includes(ipo.status)) {
    throw new AppError("IPO is not open for subscription", 400, "IPO_CLOSED");
  }
  const now = new Date();
  if (ipo.openDate > now || ipo.closeDate < now) {
    throw new AppError("Subscription window inactive", 400, "WINDOW_CLOSED");
  }
  if (lots < ipo.minLots) {
    throw new AppError(`Minimum lots is ${ipo.minLots}`, 400, "MIN_LOTS");
  }
  if (category === "RETAIL" && lots > ipo.maxLotsRetail) {
    throw new AppError(
      `Retail cap is ${ipo.maxLotsRetail} lots`,
      400,
      "MAX_LOTS"
    );
  }
  if (bidPrice < ipo.priceBand.lower || bidPrice > ipo.priceBand.upper) {
    throw new AppError("Bid outside price band", 400, "BAD_BID");
  }

  // Reject duplicate subscriptions per IPO per user.
  const existing = await IPOSubscription.findOne({ userId, ipoId });
  if (existing) {
    throw new AppError("Already subscribed", 409, "DUPLICATE");
  }

  const quantity = lots * ipo.lotSize;
  const blockedAmount = round2(quantity * bidPrice);

  // Block the funds via ledger.
  await postEntry({
    userId,
    amount: -blockedAmount,
    type: "IPO_BLOCK",
    description: `IPO block ${ipo.symbol} x ${quantity}`,
    referenceType: "IPOSubscription",
  });

  const sub = await IPOSubscription.create({
    userId,
    ipoId,
    category,
    lots,
    quantity,
    bidPrice,
    blockedAmount,
    status: "APPLIED",
  });

  if (ipo.status === "UPCOMING") {
    ipo.status = "OPEN";
    await ipo.save();
  }

  return sub;
}

// Lottery-based allotment for retail (oversubscribed): each subscription gets
// either 1 lot or 0 with probability inversely proportional to oversubscription.
// HNI/QIB get pro-rata. Result is recorded against each subscription.
async function runAllotment(ipoId) {
  const ipo = await IPO.findById(ipoId);
  if (!ipo) throw new AppError("IPO not found", 404, "NOT_FOUND");
  if (ipo.status === "ALLOTTED" || ipo.status === "LISTED") {
    return { skipped: true, ipo };
  }

  const subs = await IPOSubscription.find({ ipoId, status: "APPLIED" });
  if (subs.length === 0) {
    ipo.status = "ALLOTTED";
    await ipo.save();
    return { skipped: false, ipo, allotted: 0 };
  }

  const cutoff = ipo.cutoffPrice || ipo.priceBand.upper;
  const issueShares = Math.floor(ipo.totalIssueSize / cutoff);

  const byCategory = {
    RETAIL: { subs: [], reserved: Math.floor(issueShares * ipo.retailReservation) },
    HNI: { subs: [], reserved: Math.floor(issueShares * ipo.hniReservation) },
    QIB: { subs: [], reserved: Math.floor(issueShares * ipo.qibReservation) },
  };
  for (const s of subs) byCategory[s.category].subs.push(s);

  // Allotment per category.
  for (const cat of Object.keys(byCategory)) {
    const { subs: catSubs, reserved } = byCategory[cat];
    if (catSubs.length === 0) continue;

    const demand = catSubs.reduce((s, x) => s + x.quantity, 0);
    if (demand <= reserved) {
      // Undersubscribed — full allotment.
      for (const s of catSubs) {
        s.allottedQuantity = s.quantity;
      }
    } else if (cat === "RETAIL") {
      // Retail: lottery, allot exactly 1 lot per winner.
      const winners = Math.floor(reserved / ipo.lotSize);
      const shuffled = [...catSubs].sort(() => Math.random() - 0.5);
      for (let i = 0; i < shuffled.length; i++) {
        shuffled[i].allottedQuantity = i < winners ? ipo.lotSize : 0;
      }
    } else {
      // HNI/QIB: pro-rata, rounded down to lots.
      const ratio = reserved / demand;
      for (const s of catSubs) {
        const raw = Math.floor((s.quantity * ratio) / ipo.lotSize) * ipo.lotSize;
        s.allottedQuantity = raw;
      }
    }
  }

  // Settle each subscription: release block, debit allotted cost, credit
  // refund, write holding.
  for (const s of subs) {
    const allottedAmount = round2(s.allottedQuantity * cutoff);
    s.allottedAmount = allottedAmount;
    s.status = s.allottedQuantity > 0 ? "ALLOTTED" : "NOT_ALLOTTED";
    s.allottedAt = new Date();

    // Refund the full block, then re-debit the allotted portion.
    await postEntry({
      userId: s.userId,
      amount: s.blockedAmount,
      type: "IPO_RELEASE",
      description: `IPO release ${ipo.symbol}`,
      referenceType: "IPOSubscription",
      referenceId: s._id,
    });

    if (allottedAmount > 0) {
      await postEntry({
        userId: s.userId,
        amount: -allottedAmount,
        type: "IPO_ALLOTMENT",
        description: `IPO allotment ${ipo.symbol} x ${s.allottedQuantity}`,
        referenceType: "IPOSubscription",
        referenceId: s._id,
      });

      // Create the holding at the allotment (cut-off) price. Treat as CNC.
      await Holding.findOneAndUpdate(
        {
          userId: s.userId,
          symbol: ipo.symbol,
          exchange: ipo.exchange,
          productType: "CNC",
        },
        {
          $setOnInsert: {
            quantity: s.allottedQuantity,
            averagePrice: cutoff,
            investedAmount: allottedAmount,
            lastPrice: ipo.listingPrice || cutoff,
            openedAt: new Date(),
            lastTradedAt: new Date(),
          },
        },
        { upsert: true, new: true }
      );
    }

    await s.save();
  }

  // Track subscription stats.
  const stats = { retail: 0, hni: 0, qib: 0, overall: 0 };
  for (const cat of Object.keys(byCategory)) {
    const demand = byCategory[cat].subs.reduce((sum, x) => sum + x.quantity, 0);
    const r = byCategory[cat].reserved;
    if (r > 0) stats[cat.toLowerCase()] = round2(demand / r);
    stats.overall += demand;
  }
  stats.overall = round2(stats.overall / Math.max(1, issueShares));
  ipo.subscriptionStats = stats;
  ipo.status = "ALLOTTED";
  await ipo.save();

  // Register on stock master so post-listing the symbol is tradable.
  await StockMaster.findOneAndUpdate(
    { symbol: ipo.symbol, exchange: ipo.exchange },
    {
      $setOnInsert: {
        symbol: ipo.symbol,
        companyName: ipo.companyName,
        exchange: ipo.exchange,
        sector: ipo.sector,
        industry: ipo.industry,
        lotSize: ipo.lotSize,
        isActive: true,
        isTradable: false, // not tradable until listing day
      },
    },
    { upsert: true, new: true }
  );

  return { skipped: false, ipo, allotted: subs.filter((s) => s.allottedQuantity > 0).length };
}

async function markListed(ipoId, listingPrice) {
  const ipo = await IPO.findById(ipoId);
  if (!ipo) throw new AppError("IPO not found", 404, "NOT_FOUND");
  ipo.listingPrice = listingPrice;
  ipo.status = "LISTED";
  await ipo.save();
  await StockMaster.findOneAndUpdate(
    { symbol: ipo.symbol, exchange: ipo.exchange },
    { $set: { lastPrice: listingPrice, previousClose: listingPrice, isTradable: true } }
  );
  return ipo;
}

async function mySubscriptions(userId) {
  return IPOSubscription.find({ userId })
    .populate("ipoId")
    .sort({ createdAt: -1 })
    .lean();
}

module.exports = {
  listIPOs,
  getIPO,
  subscribe,
  runAllotment,
  markListed,
  mySubscriptions,
};
