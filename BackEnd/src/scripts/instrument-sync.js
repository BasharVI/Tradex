#!/usr/bin/env node
const mongoose = require("mongoose");
const { mongoUri } = require("../config/env");
const MarketService = require("../services/marketData/marketData.service");
const MockProvider = require("../services/marketData/providers/MockProvider");
const StockMaster = require("../models/StockMaster");

async function connectDb() {
  await mongoose.connect(mongoUri, { connectTimeoutMS: 10000 });
}

async function sync() {
  console.log("[sync] starting instrument master sync");
  // Providers may implement a bulk instrument fetch; as a fallback, run paged searches
  try {
    let instruments = [];
    try {
      if (MarketService && MarketService.provider && typeof MarketService.provider.search === "function") {
        instruments = await MarketService.provider.search("", 10000);
      }
    } catch (err) {
      console.warn("[sync] provider.search failed:", err && err.message ? err.message : err);
    }

    if (!Array.isArray(instruments) || instruments.length === 0) {
      console.warn("[sync] provider did not return instruments; falling back to MockProvider");
      const mock = new MockProvider();
      instruments = await mock.search("", 1000);
    }
    console.log(`[sync] fetched ${instruments.length} instruments`);
    let upserts = 0;
    for (const inst of instruments) {
      const symbol = (inst.symbol || inst.ticker || inst.code || "").toUpperCase();
      if (!symbol) continue;
      const doc = {
        symbol,
        companyName: inst.companyName || inst.name || symbol,
        exchange: inst.exchange || "NSE",
        sector: inst.sector || "UNCATEGORIZED",
        industry: inst.industry || "UNCATEGORIZED",
        isin: inst.isin,
      };
      const res = await StockMaster.updateOne({ symbol: doc.symbol, exchange: doc.exchange }, { $set: doc }, { upsert: true });
      if (res.upserted || res.nModified) upserts++;
    }
    console.log(`[sync] upserted ${upserts} instruments`);
  } catch (err) {
    console.error("[sync] failed:", err && err.message ? err.message : err);
    process.exitCode = 2;
  }
}

async function main() {
  await connectDb();
  await sync();
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
