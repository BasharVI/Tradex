import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AddFund from "../components/AddFund";
import Watchlist from "../components/Watchlist";
import { api, auth, formatINR, formatPct } from "../lib/api";

const Stat = ({ label, value, color }) => (
  <div style={{ background: "#fff", padding: 12, borderRadius: 6, border: "1px solid #eee" }}>
    <div style={{ fontSize: 12, color: "#888" }}>{label}</div>
    <div style={{ fontSize: 18, fontWeight: 600, color: color || "inherit" }}>{value}</div>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const user = auth.user;
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    (async () => {
      try {
        const data = await api("/portfolio/summary");
        setSummary(data.summary);
      } catch {
        // First-login: portfolio might be empty.
      }
    })();
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="dashboard">
      <Watchlist />
      <div className="dash-content">
        <h1>Welcome {user.username}</h1>
        {summary && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 16 }}>
            <Stat label="Portfolio Value" value={formatINR(summary.portfolioValue)} />
            <Stat label="Available Cash" value={formatINR(summary.availableCash)} />
            <Stat
              label="Total Return"
              value={`${formatINR(summary.totalReturn)} (${formatPct(summary.totalReturnPct)})`}
              color={summary.totalReturn >= 0 ? "green" : "crimson"}
            />
            <Stat
              label="Day Return"
              value={`${formatINR(summary.dailyReturn)} (${formatPct(summary.dailyReturnPct)})`}
              color={summary.dailyReturn >= 0 ? "green" : "crimson"}
            />
          </div>
        )}
        <AddFund />
      </div>
    </div>
  );
};

export default Dashboard;
