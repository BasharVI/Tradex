// Indian equity brokerage charge calculator. Mirrors the Zerodha/discount-broker
// fee model used as the de-facto reference in the Indian retail trading world.
//
// All rates are kept here in one place so they can be tuned without touching
// the trading engine. Returns rupee-denominated charges rounded to 2 dp.
//
// Reference (as of FY 2024-25):
//   Brokerage:
//     CNC (delivery)  - 0
//     MIS (intraday)  - min(0.03% of turnover, ₹20)
//   STT:
//     CNC BUY/SELL    - 0.1% of turnover (both legs)
//     MIS BUY         - 0
//     MIS SELL        - 0.025% of turnover
//   Exchange txn:
//     NSE             - 0.00322% of turnover
//     BSE             - 0.00375% of turnover
//   GST                - 18% on (brokerage + exchange txn + sebi)
//   SEBI              - ₹10 per crore of turnover (= 0.0001%)
//   Stamp duty (BUY only):
//     CNC             - 0.015% of turnover
//     MIS             - 0.003% of turnover
//
// The values are configurable via env so test/staging can override.

const cfg = {
  brokerage: {
    mis: {
      pct: Number(process.env.CHG_MIS_BROK_PCT || 0.0003),
      cap: Number(process.env.CHG_MIS_BROK_CAP || 20),
    },
    cnc: { pct: 0, cap: 0 },
  },
  stt: {
    cnc: { buy: 0.001, sell: 0.001 },
    mis: { buy: 0, sell: 0.00025 },
  },
  exchange: {
    NSE: 0.0000322,
    BSE: 0.0000375,
  },
  gst: 0.18,
  sebi: 0.000001, // ₹10 per crore
  stampDuty: {
    cnc: 0.00015,
    mis: 0.00003,
  },
};

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * @param {object} args
 * @param {"BUY"|"SELL"} args.side
 * @param {"CNC"|"MIS"} args.productType
 * @param {"NSE"|"BSE"} args.exchange
 * @param {number} args.price
 * @param {number} args.quantity
 * @returns {{brokerage:number, stt:number, exchangeTxnCharges:number,
 *            gst:number, sebiCharges:number, stampDuty:number, total:number,
 *            turnover:number}}
 */
function calculateCharges({ side, productType, exchange, price, quantity }) {
  const turnover = price * quantity;
  if (turnover <= 0) {
    return zeroCharges(turnover);
  }

  // Brokerage
  const brokCfg = cfg.brokerage[productType.toLowerCase()];
  const brokerage = brokCfg.cap
    ? Math.min(turnover * brokCfg.pct, brokCfg.cap)
    : turnover * brokCfg.pct;

  // STT
  const sttRate = cfg.stt[productType.toLowerCase()][side.toLowerCase()];
  const stt = turnover * sttRate;

  // Exchange transaction charges
  const exchRate = cfg.exchange[exchange] || cfg.exchange.NSE;
  const exchangeTxnCharges = turnover * exchRate;

  // SEBI charges
  const sebiCharges = turnover * cfg.sebi;

  // GST (on brokerage + exchange txn + SEBI)
  const gst = (brokerage + exchangeTxnCharges + sebiCharges) * cfg.gst;

  // Stamp duty (BUY only)
  let stampDuty = 0;
  if (side === "BUY") {
    stampDuty = turnover * cfg.stampDuty[productType.toLowerCase()];
  }

  const total =
    brokerage + stt + exchangeTxnCharges + gst + sebiCharges + stampDuty;

  return {
    brokerage: round2(brokerage),
    stt: round2(stt),
    exchangeTxnCharges: round2(exchangeTxnCharges),
    gst: round2(gst),
    sebiCharges: round2(sebiCharges),
    stampDuty: round2(stampDuty),
    total: round2(total),
    turnover: round2(turnover),
  };
}

function zeroCharges(turnover) {
  return {
    brokerage: 0,
    stt: 0,
    exchangeTxnCharges: 0,
    gst: 0,
    sebiCharges: 0,
    stampDuty: 0,
    total: 0,
    turnover: round2(turnover),
  };
}

/**
 * Net cash impact of a single fill, signed.
 *   BUY  -> -(turnover + charges.total)
 *   SELL -> +(turnover - charges.total)
 */
function netCashFlow({ side, charges }) {
  if (side === "BUY") return -round2(charges.turnover + charges.total);
  return round2(charges.turnover - charges.total);
}

module.exports = { calculateCharges, netCashFlow, _cfg: cfg };
