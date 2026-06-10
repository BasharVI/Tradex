import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Watchlist from "./Watchlist";
import { api } from "../lib/api";

const AV_KEY = process.env.REACT_APP_ALPHAVANTAGE_KEY || "";

const Stocks = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Seed from router state if the caller passed a cached price (e.g. from the
  // watchlist). Avoids a flash of $0 while the live fetch is in flight, and
  // also gives us a sane fallback when Alphavantage rate-limits us.
  const seededPrice = Number(location.state && location.state.price) || 0;

  const [stockData, setStockData] = useState({ symbol: id, LTP: seededPrice });
  const [quantity, setQuantity] = useState("");
  const [buySell, setBuySell] = useState("buy");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!AV_KEY) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(
            id
          )}&apikey=${AV_KEY}`
        );
        const result = await res.json();
        const quote = result && result["Global Quote"];
        const price = quote ? Number(quote["05. price"]) : 0;
        // Only update on a real, positive price. A rate-limited or empty
        // response must not clobber the seeded / previously fetched value.
        if (!cancelled && Number.isFinite(price) && price > 0) {
          setStockData({ symbol: id, LTP: price });
        }
      } catch {
        // Swallow — keep whatever LTP we already have.
      }
    })();
    return () => {
      cancelled = true;
    };
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
