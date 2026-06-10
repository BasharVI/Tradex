import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Watchlist from "./Watchlist";
import { api } from "../lib/api";

const AV_KEY = process.env.REACT_APP_ALPHAVANTAGE_KEY || "";

const Stocks = () => {
  const [stockData, setStockData] = useState({ symbol: "", LTP: 0 });
  const [quantity, setQuantity] = useState("");
  const [buySell, setBuySell] = useState("buy");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      if (!AV_KEY) {
        setStockData({ symbol: id, LTP: 0 });
        return;
      }
      try {
        const res = await fetch(
          `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${encodeURIComponent(
            id
          )}&interval=5min&apikey=${AV_KEY}`
        );
        const result = await res.json();
        const series = Object.values(result)[1];
        const first = series ? Object.values(series)[0] : null;
        const LTP = first ? Number(first["4. close"]) : 0;
        setStockData({ symbol: id, LTP });
      } catch {
        setStockData({ symbol: id, LTP: 0 });
      }
    })();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const q = Number(quantity);
    if (!Number.isInteger(q) || q < 1) {
      setError("Quantity must be a positive integer");
      return;
    }
    if (!stockData.LTP || stockData.LTP <= 0) {
      setError("No current price available — try again in a moment");
      return;
    }
    setSubmitting(true);
    try {
      await api("/portfolio", {
        method: "POST",
        body: {
          symbol: id,
          quantity: q,
          buySell,
          price: stockData.LTP,
        },
      });
      navigate("/portfolio");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="outercontainer">
      <Watchlist />
      <div className="stockspage">
        <h1>{stockData.symbol}</h1>
        <h2>${Number(stockData.LTP || 0).toFixed(2)}</h2>
        {error && <p style={{ color: "crimson" }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="quantity-container">
            <label>
              Quantity:
              <input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </label>
          </div>
          <br />
          <div className="action-container">
            <label>
              Buy/Sell:
              <select
                value={buySell}
                onChange={(e) => setBuySell(e.target.value)}
              >
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </select>
            </label>
            <br />
            <button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Stocks;
