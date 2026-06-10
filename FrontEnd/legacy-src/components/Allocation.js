import React, { useEffect, useState } from "react";
import { api, formatINR, formatPct } from "../lib/api";

const Allocation = () => {
  const [by, setBy] = useState("sector");
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await api(`/portfolio/allocation?by=${by}`);
        setRows(data.allocation || []);
      } catch (err) {
        setError(err.message);
      }
    })();
  }, [by]);

  return (
    <div>
      <h2>Allocation</h2>
      <select value={by} onChange={(e) => setBy(e.target.value)}>
        <option value="sector">By Sector</option>
        <option value="industry">By Industry</option>
      </select>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <table>
        <thead>
          <tr>
            <th>{by === "sector" ? "Sector" : "Industry"}</th>
            <th>Value</th>
            <th>Invested</th>
            <th>P&L</th>
            <th>P&L %</th>
            <th>Allocation %</th>
            <th>#</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name}>
              <td>{r.name}</td>
              <td>{formatINR(r.value)}</td>
              <td>{formatINR(r.invested)}</td>
              <td style={{ color: r.pnl >= 0 ? "green" : "crimson" }}>{formatINR(r.pnl)}</td>
              <td style={{ color: r.pnl >= 0 ? "green" : "crimson" }}>{formatPct(r.pnlPct)}</td>
              <td>{formatPct(r.allocationPct)}</td>
              <td>{r.count}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={7} style={{ textAlign: "center", padding: 16, color: "#888" }}>No allocation data — buy something first.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Allocation;
