import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

// NOTE: the Alphavantage API key was previously hardcoded in this file. It
// belongs server-side; until the backend proxies these calls, surface it via
// REACT_APP_ALPHAVANTAGE_KEY so it can at least be rotated without a rebuild.
const AV_KEY = process.env.REACT_APP_ALPHAVANTAGE_KEY || "";

const extractLatestPrice = (intradayResult) => {
  try {
    const series = Object.values(intradayResult)[1];
    if (!series) return null;
    const first = Object.values(series)[0];
    if (!first) return null;
    return Number(first["4. close"]);
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
          `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${encodeURIComponent(
            symbol
          )}&interval=5min&apikey=${AV_KEY}`
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

  const handleStockClick = (e) => {
    const stock = e.target.innerText;
    navigate(`/stock/${stock}`);
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
          <h4 onClick={handleStockClick}>{data.symbol}</h4>
          <h4>${Number(data.currentPrice || 0).toFixed(2)}</h4>
          <button onClick={() => handleRemoveStock(data.symbol)}>-</button>
        </div>
      ))}
    </div>
  );
};

export default Watchlist;
