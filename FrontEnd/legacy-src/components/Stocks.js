import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Watchlist from "./Watchlist";
import { api, formatINR, formatPct } from "../lib/api";

const Stocks = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const seededExchange = (location.state && location.state.exchange) || "NSE";

  const [stock, setStock] = useState(null);
  const [exchange, setExchange] = useState(seededExchange);
  const [side, setSide] = useState("BUY");
  const [orderType, setOrderType] = useState("MARKET");
  const [productType, setProductType] = useState("CNC");
  const [quantity, setQuantity] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await api(`/stocks/${id}/${exchange}`);
        setStock(data.stock);
      } catch (err) {
        setError(err.message);
      }
    })();
  }, [id, exchange]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const q = Number(quantity);
    if (!Number.isInteger(q) || q < 1) return setError("Quantity must be a positive integer");
    if (orderType === "LIMIT" && (!Number(limitPrice) || Number(limitPrice) <= 0)) {
      return setError("Limit price required for LIMIT order");
    }
    setSubmitting(true);
    try {
      const body = {
        symbol: id,
        exchange,
        side,
        orderType,
        productType,
        quantity: q,
      };
      if (orderType === "LIMIT") body.limitPrice = Number(limitPrice);
      const res = await api("/orders", { method: "POST", body });
      if (res.order && res.order.status === "PENDING") {
        navigate("/orders");
      } else {
        navigate("/portfolio");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!stock) {
    return (
      <div className="outercontainer">
        <Watchlist />
        <div className="stockspage">
          {error ? <p style={{ color: "crimson" }}>{error}</p> : <p>Loading…</p>}
        </div>
      </div>
    );
  }

  const dayChg = stock.lastPrice - stock.previousClose;
  const dayChgPct = stock.previousClose ? (dayChg / stock.previousClose) * 100 : 0;

  return (
    <div className="outercontainer">
      <Watchlist />
      <div className="stockspage">
        <h1>{stock.symbol} <small style={{ color: "#888" }}>{stock.exchange}</small></h1>
        <h3 style={{ marginTop: -8, color: "#666" }}>{stock.companyName}</h3>
        <div style={{ display: "flex", gap: 16, alignItems: "baseline" }}>
          <h2>{formatINR(stock.lastPrice)}</h2>
          <span style={{ color: dayChg >= 0 ? "green" : "crimson" }}>
            {dayChg >= 0 ? "+" : ""}{formatINR(dayChg)} ({formatPct(dayChgPct)})
          </span>
        </div>
        <div style={{ fontSize: 12, color: "#888", marginBottom: 12 }}>
          Sector: {stock.sector} · Industry: {stock.industry} · Lot: {stock.lotSize}
        </div>
        {error && <p style={{ color: "crimson" }}>{error}</p>}

        <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, maxWidth: 480 }}>
          <label>Exchange
            <select value={exchange} onChange={(e) => setExchange(e.target.value)}>
              <option value="NSE">NSE</option>
              <option value="BSE">BSE</option>
            </select>
          </label>
          <label>Side
            <select value={side} onChange={(e) => setSide(e.target.value)}>
              <option value="BUY">Buy</option>
              <option value="SELL">Sell</option>
            </select>
          </label>
          <label>Order Type
            <select value={orderType} onChange={(e) => setOrderType(e.target.value)}>
              <option value="MARKET">Market</option>
              <option value="LIMIT">Limit</option>
            </select>
          </label>
          <label>Product
            <select value={productType} onChange={(e) => setProductType(e.target.value)}>
              <option value="CNC">CNC (Delivery)</option>
              <option value="MIS">MIS (Intraday)</option>
            </select>
          </label>
          <label>Quantity
            <input type="number" min="1" step="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </label>
          {orderType === "LIMIT" && (
            <label>Limit Price
              <input type="number" min="0" step="0.05" value={limitPrice} onChange={(e) => setLimitPrice(e.target.value)} />
            </label>
          )}
          <button type="submit" disabled={submitting} style={{ gridColumn: "1 / -1" }}>
            {submitting ? "Placing..." : `${side} ${id}`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Stocks;
