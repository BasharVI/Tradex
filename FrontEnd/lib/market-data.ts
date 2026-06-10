export type WatchItem = {
  symbol: string;
  name: string;
  exchange: "NSE" | "BSE";
  price: number;
  change: number;
  volume: string;
};

export type Holding = {
  symbol: string;
  sector: string;
  qty: number;
  avg: number;
  ltp: number;
  invested: number;
  value: number;
  day: number;
  pnl: number;
  pnlPct: number;
  risk: "Low" | "Moderate" | "Elevated";
};

export const watchlist: WatchItem[] = [
  { symbol: "RELIANCE", name: "Reliance Industries", exchange: "NSE", price: 2864, change: 0.84, volume: "28.4L" },
  { symbol: "HDFCBANK", name: "HDFC Bank", exchange: "NSE", price: 1691, change: -0.31, volume: "41.9L" },
  { symbol: "INFY", name: "Infosys", exchange: "NSE", price: 1458, change: 1.18, volume: "19.2L" },
  { symbol: "TATAMOTORS", name: "Tata Motors", exchange: "NSE", price: 987, change: 2.06, volume: "54.7L" },
  { symbol: "SUNPHARMA", name: "Sun Pharma", exchange: "NSE", price: 1518, change: -0.62, volume: "12.3L" },
  { symbol: "LT", name: "Larsen & Toubro", exchange: "NSE", price: 3644, change: 0.45, volume: "8.8L" },
  { symbol: "TCS", name: "Tata Consultancy Services", exchange: "NSE", price: 3925, change: -0.18, volume: "10.6L" },
];

export const holdings: Holding[] = [
  { symbol: "RELIANCE", sector: "Energy", qty: 24, avg: 2740, ltp: 2864, invested: 65760, value: 68736, day: 0.84, pnl: 2976, pnlPct: 4.52, risk: "Moderate" },
  { symbol: "INFY", sector: "IT", qty: 45, avg: 1390, ltp: 1458, invested: 62550, value: 65610, day: 1.18, pnl: 3060, pnlPct: 4.89, risk: "Low" },
  { symbol: "HDFCBANK", sector: "Financials", qty: 32, avg: 1725, ltp: 1691, invested: 55200, value: 54112, day: -0.31, pnl: -1088, pnlPct: -1.97, risk: "Low" },
  { symbol: "TATAMOTORS", sector: "Auto", qty: 70, avg: 921, ltp: 987, invested: 64470, value: 69090, day: 2.06, pnl: 4620, pnlPct: 7.17, risk: "Elevated" },
  { symbol: "SUNPHARMA", sector: "Healthcare", qty: 18, avg: 1492, ltp: 1518, invested: 26856, value: 27324, day: -0.62, pnl: 468, pnlPct: 1.74, risk: "Low" },
];

export const performance = [68, 71, 69, 76, 80, 78, 84, 86, 83, 89, 92, 96];

export const sectorAllocation = [
  { label: "Auto", value: 23, color: "hsl(var(--primary))" },
  { label: "Energy", value: 22, color: "hsl(var(--secondary))" },
  { label: "IT", value: 21, color: "hsl(var(--accent))" },
  { label: "Financials", value: 19, color: "hsl(var(--success))" },
  { label: "Healthcare", value: 15, color: "hsl(var(--destructive))" },
];

export const recentTrades = [
  { time: "09:21", symbol: "TATAMOTORS", side: "BUY", qty: 20, price: 982, status: "Executed" },
  { time: "10:02", symbol: "HDFCBANK", side: "SELL", qty: 8, price: 1695, status: "Executed" },
  { time: "10:47", symbol: "INFY", side: "BUY", qty: 15, price: 1449, status: "Executed" },
  { time: "11:16", symbol: "LT", side: "BUY", qty: 4, price: 3632, status: "Pending" },
];

export const heatmap = [
  { symbol: "TATAMOTORS", sector: "Auto", change: 2.06, weight: 19 },
  { symbol: "INFY", sector: "IT", change: 1.18, weight: 17 },
  { symbol: "RELIANCE", sector: "Energy", change: 0.84, weight: 18 },
  { symbol: "LT", sector: "Infra", change: 0.45, weight: 12 },
  { symbol: "TCS", sector: "IT", change: -0.18, weight: 13 },
  { symbol: "HDFCBANK", sector: "Financials", change: -0.31, weight: 16 },
  { symbol: "SUNPHARMA", sector: "Healthcare", change: -0.62, weight: 9 },
];

export const behaviorMetrics = [
  { label: "Plan adherence", value: 86 },
  { label: "Position discipline", value: 78 },
  { label: "Loss acceptance", value: 71 },
  { label: "Overtrade control", value: 82 },
];

export const leaderboard = [
  { rank: 1, name: "Aarav M.", metric: "+12.8%", consistency: 91 },
  { rank: 2, name: "Nisha R.", metric: "+10.4%", consistency: 88 },
  { rank: 3, name: "Kabir S.", metric: "+8.9%", consistency: 84 },
  { rank: 4, name: "You", metric: "+7.6%", consistency: 81 },
];
