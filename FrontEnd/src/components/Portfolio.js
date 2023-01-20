import React, { useEffect, useState } from "react";
import Watchlist from "./Watchlist";

const Portfolio = () => {
  const [details, setdetails] = useState([]);

  const userId = JSON.parse(localStorage.getItem("user"))._id;

  useEffect(() => {
    (async () => {
      let result = await fetch(
        `http://localhost:5000/portfolio?userId=${userId}`,
        {
          method: "get",
          headers: { "Content-Type": "application/json" },
        }
      );
      result = await result.json();
      const portfolio = result.portfolio;
      setdetails(portfolio);
    })();
  }, [userId]);

  return (
    <div className="portfolio">
      <Watchlist />
      <div className="portfolio-details">
        <h2>Portfolio</h2>
        <table>
          <thead>
            <tr>
              <th>Stock</th>
              <th>Buy price</th>
              <th>LTP</th>
              <th>Profit/Loss</th>
            </tr>
          </thead>
          <tbody>
            {details.length > 0 &&
              details.map((data, i) => (
                <tr key={i}>
                  <td>{data.stockName}</td>
                  <td>$ {data.boughtPrice}</td>
                  <td>$ {data.quantity}</td>
                  <td>{27 - 25}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Portfolio;
