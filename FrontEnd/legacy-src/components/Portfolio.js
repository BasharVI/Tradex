import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Watchlist from "./Watchlist";
import { api, formatINR, formatPct } from "../lib/api";

const pnlColor = (n) => (Number(n) >= 0 ? "green" : "crimson");

const Summary = ({ s }) => (
  <div className="portfolio-summary" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
    <Stat label="Portfolio Value" value={formatINR(s.portfolioValue)} />
    <Stat label="Invested" value={formatINR(s.investedAmount)} />
    <Stat label="Available Cash" value={formatINR(s.availableCash)} />
    <Stat label="Day Return" value={formatINR(s.dailyReturn)} sub={formatPct(s.dailyReturnPct)} color={pnlColor(s.dailyReturn)} />
    <Stat label="Unrealized P&L" value={formatINR(s.unrealizedPnL)} color={pnlColor(s.unrealizedPnL)} />
    <Stat label="Realized P&L" value={formatINR(s.realizedPnL)} color={pnlColor(s.realizedPnL)} />
    <Stat label="Total Return" value={formatINR(s.totalReturn)} sub={formatPct(s.totalReturnPct)} color={pnlColor(s.totalReturn)} />
    <Stat label="Starting Capital" value={formatINR(s.startingCapital)} />
  </div>
);

const Stat = ({ label, value, sub, color }) => (
  <div className="stat" style={{ background: "#fff", padding: 10, borderRadius: 6, border: "1px solid #eee" }}>
    <div style={{ fontSize: 12, color: "#888" }}>{label}</div>
    <div style={{ fontSize: 18, fontWeight: 600, color: color || "inherit" }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: color || "#888" }}>{sub}</div>}
  </div>
);

const Portfolio = () => {
  const [summary, setSummary] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const data = await api("/portfolio");
        setSummary(data.summary);
        setHoldings(data.holdings || []);
      } catch (err) {
        setError(err.message);
      }
    })();
  }, []);

  return (
    <div className="portfolio">
      <Watchlist />
      <div className="portfolio-details">
        <h2>Portfolio</h2>
        {error && <p style={{ color: "crimson" }}>{error}</p>}
        {summary && <Summary s={summary} />}
        <table>
          <thead>
            <tr>
              <th>Stock</th>
              <th>Exch</th>
              <th>Type</th>
              <th>Qty</th>
              <th>Avg Cost</th>
              <th>LTP</th>
              <th>Invested</th>
              <th>Value</th>
              <th>Day Chg %</th>
              <th>P&L</th>
              <th>P&L %</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((h) => (
              <tr key={h._id}>
                <td
                  style={{ cursor: "pointer", color: "#1e6fff" }}
                  onClick={() => navigate(`/stock/${h.symbol}`, { state: { exchange: h.exchange } })}
                >
                  {h.symbol}
                </td>
                <td>{h.exchange}</td>
                <td>{h.productType}</td>
                <td>{h.quantity}</td>
                <td>{formatINR(h.averagePrice)}</td>
                <td>{formatINR(h.ltp)}</td>
                <td>{formatINR(h.investedAmount)}</td>
                <td>{formatINR(h.currentValue)}</td>
                <td style={{ color: pnlColor(h.dayChangePct) }}>{formatPct(h.dayChangePct)}</td>
                <td style={{ color: pnlColor(h.unrealizedPnL) }}>{formatINR(h.unrealizedPnL)}</td>
                <td style={{ color: pnlColor(h.unrealizedPnLPct) }}>{formatPct(h.unrealizedPnLPct)}</td>
              </tr>
            ))}
            {holdings.length === 0 && (
              <tr>
                <td colSpan={11} style={{ textAlign: "center", padding: 20, color: "#888" }}>
                  No holdings yet — search a stock to place your first order.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Portfolio;
