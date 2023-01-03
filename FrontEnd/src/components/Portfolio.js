import React from "react";
import Watchlist from "./Watchlist";

const Portfolio = () => {
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
            <tr>
              <td>UPWK</td>
              <td>$ 25</td>
              <td>$ 27</td>
              <td>{27 - 25}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Portfolio;
