import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, formatINR, formatPct } from "../lib/api";

const Watchlist = () => {
  const [items, setItems] = useState([]);
  const [results, setResults] = useState([]);
  const [query, setQuery] = useState("");
  const [exchange, setExchange] = useState("NSE");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const load = async () => {
    try {
      const data = await api("/watchlist");
      setItems(data.watchlist || []);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const search = async (e) => {
    if (e.key !== "Enter") return;
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    try {
      const data = await api(`/stocks?q=${encodeURIComponent(q)}&exchange=${exchange}&limit=8`);
      setResults(data.stocks || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const add = async (s) => {
    try {
      await api("/watchlist", {
        method: "POST",
        body: { symbol: s.symbol, exchange: s.exchange },
      });
      setResults([]);
      setQuery("");
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (symbol) => {
    try {
      await api("/watchlist", { method: "DELETE", body: { symbol } });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="watchlist">
      <div className="search">
        <div style={{ display: "flex", gap: 4 }}>
          <select value={exchange} onChange={(e) => setExchange(e.target.value)}>
            <option value="NSE">NSE</option>
            <option value="BSE">BSE</option>
          </select>
          <input
            className="inputfield"
            type="search"
            placeholder="Search e.g. RELIANCE"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={search}
            style={{ flex: 1 }}
          />
        </div>
        {results.length > 0 && results.map((s) => (
          <div className="search-list" key={`${s.symbol}-${s.exchange}`}>
            <div>
              <h4>{s.symbol}</h4>
              <span style={{ fontSize: 11, color: "#888" }}>{s.companyName}</span>
            </div>
            <button onClick={() => add(s)}>+</button>
          </div>
        ))}
      </div>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {items.map((w) => (
        <div className="stock-list" key={w._id}>
          <div
            onClick={() => navigate(`/stock/${w.symbol}`, { state: { exchange: w.exchange } })}
            style={{ cursor: "pointer" }}
          >
            <h4>{w.symbol} <small style={{ color: "#888" }}>{w.exchange}</small></h4>
            <span style={{ fontSize: 11, color: "#888" }}>{w.companyName}</span>
          </div>
          <div style={{ textAlign: "right" }}>
            <div>{formatINR(w.lastPrice)}</div>
            <small style={{ color: w.changePct >= 0 ? "green" : "crimson" }}>
              {formatPct(w.changePct)}
            </small>
          </div>
          <button onClick={() => remove(w.symbol)}>-</button>
        </div>
      ))}
    </div>
  );
};

export default Watchlist;
