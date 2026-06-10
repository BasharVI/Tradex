import React, { useEffect, useState } from "react";
import { api, formatINR, formatPct } from "../lib/api";

// Map a signed percentage to a green/red intensity. Clamps at +/-5%.
const cellColor = (pct) => {
  const v = Math.max(-5, Math.min(5, Number(pct) || 0));
  const intensity = Math.min(1, Math.abs(v) / 5);
  const alpha = 0.15 + intensity * 0.6;
  return v >= 0 ? `rgba(40,167,69,${alpha})` : `rgba(220,53,69,${alpha})`;
};

const Heatmap = () => {
  const [mode, setMode] = useState("sector");
  const [cells, setCells] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await api(`/heatmap/${mode}`);
        setCells(data.cells || []);
      } catch (err) {
        setError(err.message);
      }
    })();
  }, [mode]);

  return (
    <div>
      <h2>Heatmap</h2>
      <div style={{ marginBottom: 8 }}>
        <button onClick={() => setMode("sector")} disabled={mode === "sector"}>Sector</button>
        <button onClick={() => setMode("holdings")} disabled={mode === "holdings"}>Holdings</button>
      </div>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {cells.map((c, i) => {
          const isSector = mode === "sector";
          const label = isSector ? c.sector : c.symbol;
          const pct = isSector ? c.dayChangePct : c.changePct;
          const size = Math.max(70, Math.min(180, (c.value || 0) ** 0.5 / 10 + 70));
          return (
            <div
              key={`${label}-${i}`}
              title={isSector ? c.sector : `${c.symbol} ${c.exchange}`}
              style={{
                width: size,
                height: size,
                background: cellColor(pct),
                color: "#222",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                borderRadius: 4,
                padding: 4,
                fontSize: 11,
                border: "1px solid rgba(0,0,0,0.05)",
              }}
            >
              <b>{label}</b>
              <div>{formatPct(pct)}</div>
              <div style={{ fontSize: 10 }}>{formatINR(c.value)}</div>
            </div>
          );
        })}
        {cells.length === 0 && <p style={{ color: "#888" }}>No data yet.</p>}
      </div>
    </div>
  );
};

export default Heatmap;
