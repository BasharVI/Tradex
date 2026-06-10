// Seeds StockMaster with a representative set of NSE + BSE listings so the app
// is usable out of the box. Idempotent — runs as an upsert keyed by
// (symbol, exchange).
//
//   node src/scripts/seed-stocks.js

const { connectDb } = require("../config/db");
const mongoose = require("mongoose");
const StockMaster = require("../models/StockMaster");

const SEED = [
  // NSE
  { symbol: "RELIANCE", companyName: "Reliance Industries Ltd", exchange: "NSE", sector: "Energy", industry: "Oil & Gas", marketCap: 1900000, isin: "INE002A01018", lotSize: 1, lastPrice: 2890, previousClose: 2860 },
  { symbol: "TCS", companyName: "Tata Consultancy Services Ltd", exchange: "NSE", sector: "IT", industry: "IT Services", marketCap: 1450000, isin: "INE467B01029", lotSize: 1, lastPrice: 3920, previousClose: 3895 },
  { symbol: "INFY", companyName: "Infosys Ltd", exchange: "NSE", sector: "IT", industry: "IT Services", marketCap: 720000, isin: "INE009A01021", lotSize: 1, lastPrice: 1685, previousClose: 1690 },
  { symbol: "HDFCBANK", companyName: "HDFC Bank Ltd", exchange: "NSE", sector: "Financials", industry: "Banking", marketCap: 1280000, isin: "INE040A01034", lotSize: 1, lastPrice: 1645, previousClose: 1635 },
  { symbol: "ICICIBANK", companyName: "ICICI Bank Ltd", exchange: "NSE", sector: "Financials", industry: "Banking", marketCap: 870000, isin: "INE090A01021", lotSize: 1, lastPrice: 1180, previousClose: 1175 },
  { symbol: "SBIN", companyName: "State Bank of India", exchange: "NSE", sector: "Financials", industry: "Banking", marketCap: 720000, isin: "INE062A01020", lotSize: 1, lastPrice: 820, previousClose: 815 },
  { symbol: "ITC", companyName: "ITC Ltd", exchange: "NSE", sector: "FMCG", industry: "Tobacco/FMCG", marketCap: 540000, isin: "INE154A01025", lotSize: 1, lastPrice: 445, previousClose: 442 },
  { symbol: "HINDUNILVR", companyName: "Hindustan Unilever Ltd", exchange: "NSE", sector: "FMCG", industry: "Personal Care", marketCap: 560000, isin: "INE030A01027", lotSize: 1, lastPrice: 2390, previousClose: 2410 },
  { symbol: "BHARTIARTL", companyName: "Bharti Airtel Ltd", exchange: "NSE", sector: "Telecom", industry: "Telecom Services", marketCap: 870000, isin: "INE397D01024", lotSize: 1, lastPrice: 1530, previousClose: 1515 },
  { symbol: "LT", companyName: "Larsen & Toubro Ltd", exchange: "NSE", sector: "Industrials", industry: "Construction", marketCap: 510000, isin: "INE018A01030", lotSize: 1, lastPrice: 3680, previousClose: 3650 },
  { symbol: "MARUTI", companyName: "Maruti Suzuki India Ltd", exchange: "NSE", sector: "Auto", industry: "Passenger Vehicles", marketCap: 350000, isin: "INE585B01010", lotSize: 1, lastPrice: 11200, previousClose: 11150 },
  { symbol: "ASIANPAINT", companyName: "Asian Paints Ltd", exchange: "NSE", sector: "Consumer Discretionary", industry: "Paints", marketCap: 290000, isin: "INE021A01026", lotSize: 1, lastPrice: 2980, previousClose: 2965 },
  { symbol: "AXISBANK", companyName: "Axis Bank Ltd", exchange: "NSE", sector: "Financials", industry: "Banking", marketCap: 380000, isin: "INE238A01034", lotSize: 1, lastPrice: 1240, previousClose: 1230 },
  { symbol: "WIPRO", companyName: "Wipro Ltd", exchange: "NSE", sector: "IT", industry: "IT Services", marketCap: 240000, isin: "INE075A01022", lotSize: 1, lastPrice: 525, previousClose: 520 },
  { symbol: "TATAMOTORS", companyName: "Tata Motors Ltd", exchange: "NSE", sector: "Auto", industry: "Commercial Vehicles", marketCap: 340000, isin: "INE155A01022", lotSize: 1, lastPrice: 905, previousClose: 895 },
  { symbol: "SUNPHARMA", companyName: "Sun Pharmaceutical Industries", exchange: "NSE", sector: "Healthcare", industry: "Pharmaceuticals", marketCap: 410000, isin: "INE044A01036", lotSize: 1, lastPrice: 1710, previousClose: 1695 },

  // BSE — same names on the BSE side, slight price drift.
  { symbol: "RELIANCE", companyName: "Reliance Industries Ltd", exchange: "BSE", sector: "Energy", industry: "Oil & Gas", marketCap: 1900000, isin: "INE002A01018", lotSize: 1, lastPrice: 2889, previousClose: 2861 },
  { symbol: "TCS", companyName: "Tata Consultancy Services Ltd", exchange: "BSE", sector: "IT", industry: "IT Services", marketCap: 1450000, isin: "INE467B01029", lotSize: 1, lastPrice: 3921, previousClose: 3894 },
  { symbol: "SENSEX500", companyName: "S&P BSE 500 ETF", exchange: "BSE", sector: "Index", industry: "ETF", marketCap: 0, lotSize: 1, lastPrice: 32.5, previousClose: 32.3 },
];

(async () => {
  await connectDb();
  let inserted = 0;
  let updated = 0;
  for (const s of SEED) {
    const res = await StockMaster.updateOne(
      { symbol: s.symbol, exchange: s.exchange },
      { $set: s },
      { upsert: true }
    );
    if (res.upsertedCount) inserted += 1;
    else if (res.modifiedCount) updated += 1;
  }
  console.log(`[seed-stocks] inserted=${inserted} updated=${updated}`);
  await mongoose.disconnect();
  process.exit(0);
})().catch((err) => {
  console.error("[seed-stocks] failed:", err);
  process.exit(1);
});
