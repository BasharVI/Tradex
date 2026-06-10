import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Watchlist from "./Watchlist";
import { api } from "../lib/api";

const fmt = (n) => Number(n || 0).toFixed(2);

const Portfolio = () => {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const data = await api("/portfolio");
        setItems(data.portfolio || []);
      } catch (err) {
        setError(err.message);
      }
    })();
  }, []);

  const handleClick = (e) => {
    const stock = e.target.innerText;
    navigate(`/stock/${stock}`);
  };

  return (
    <div className="portfolio">
      <Watchlist />
      <div className="portfolio-details">
        <h2>Portfolio</h2>
        {error && <p style={{ color: "crimson" }}>{error}</p>}
        <table>
          <thead>
            <tr>
              <th>Stock</th>
              <th>Quantity</th>
              <th>Avg. Buy Price</th>
              <th>LTP</th>
              <th>Profit/Loss</th>
            </tr>
          </thead>
          <tbody>
            {items.map((data, i) => {
              const avg = data.averagePrice ?? data.boughtPrice ?? 0;
              const ltp = data.currentPrice ?? avg;
              const pnl = (ltp - avg) * data.quantity;
              return (
                <tr key={data._id || i}>
                  <td onClick={handleClick}>{data.symbol || data.stockName}</td>
                  <td>{data.quantity}</td>
                  <td>$ {fmt(avg)}</td>
                  <td>$ {fmt(ltp)}</td>
                  <td style={{ color: pnl >= 0 ? "green" : "crimson" }}>
                    {pnl >= 0 ? "+" : ""}
                    {fmt(pnl)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Portfolio;
