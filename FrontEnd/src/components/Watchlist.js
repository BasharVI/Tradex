import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

// NOTE: the Alphavantage API key was previously hardcoded in this file. It
// belongs server-side; until the backend proxies these calls, surface it via
// REACT_APP_ALPHAVANTAGE_KEY so it can at least be rotated without a rebuild.
const AV_KEY = process.env.REACT_APP_ALPHAVANTAGE_KEY || "";

// Alphavantage's TIME_SERIES_INTRADAY moved to premium; GLOBAL_QUOTE is still
// on the free tier and gives us the single LTP value we actually need.
const extractLatestPrice = (quoteResult) => {
  try {
    const quote = quoteResult && quoteResult["Global Quote"];
    const price = quote && Number(quote["05. price"]);
    return Number.isFinite(price) && price > 0 ? price : null;
  } catch {
    return null;
  }
};

const Watchlist = () => {
  const [searchData, setSearchData] = useState([]);
  const [items, setItems] = useState([]);
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

  const handleSearch = async (e) => {
    if (e.key !== "Enter") return;
    const searchWord = e.target.value.trim();
    if (!searchWord) {
      setSearchData([]);
      return;
    }
    if (!AV_KEY) {
      setError("Stock search unavailable (missing API key)");
      return;
    }
    try {
      const res = await fetch(
        `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(
          searchWord
        )}&apikey=${AV_KEY}`
      );
      const result = await res.json();
      setSearchData(result.bestMatches || []);
    } catch (err) {
      setError("Search failed");
    }
  };

  const addToWatchlist = async (e) => {
    e.preventDefault();
    const symbol = e.target.getElementsByTagName("h4")[0].innerText.trim();
    let price = 0;
    if (AV_KEY) {
      try {
        const res = await fetch(
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(
            symbol
          )}&apikey=${AV_KEY}`
        );
        const result = await res.json();
        const latest = extractLatestPrice(result);
        if (latest) price = latest;
      } catch {
        // Ignore — server will accept 0 price and we'll refresh on load.
      }
    }
    try {
      const data = await api("/watchlist", {
        method: "POST",
        body: { symbol, price },
      });
      setItems(data.watchlist || []);
      setSearchData([]);
      const inputField = document.querySelector(".inputfield");
      if (inputField) inputField.value = "";
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveStock = async (symbol) => {
    try {
      const data = await api("/watchlist", {
        method: "DELETE",
        body: { symbol },
      });
      setItems(data.watchlist || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStockClick = (symbol, price) => {
    // Pass the cached price so the Stocks page can render immediately even if
    // Alphavantage rate-limits the live fetch.
    navigate(`/stock/${symbol}`, { state: { price } });
  };

  return (
    <div className="watchlist">
      <div className="search">
        <input
          className="inputfield"
          type="search"
          placeholder="Search stocks Eg:GOOGL "
          onKeyDown={handleSearch}
        />
        {searchData.length !== 0 &&
          searchData.slice(0, 5).map((data, index) => (
            <form key={index + 1} onSubmit={addToWatchlist}>
              <div className="search-list">
                <h4>{Object.values(data)[0]}</h4>
                <span>{Object.values(data)[1]}</span>
                <button type="submit">+</button>
              </div>
            </form>
          ))}
      </div>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {items.map((data, i) => (
        <div className="stock-list" key={data._id || i}>
          <h4 onClick={() => handleStockClick(data.symbol, data.currentPrice)}>
            {data.symbol}
          </h4>
          <h4>${Number(data.currentPrice || 0).toFixed(2)}</h4>
          <button onClick={() => handleRemoveStock(data.symbol)}>-</button>
        </div>
      ))}
    </div>
  );
};

export default Watchlist;
