import React from "react";
import Watchlist from "./Watchlist";

const Orders = () => {
  return (
    <div className="orders">
      <Watchlist />
      <div className="orders-details">
        <h2>Orders</h2>
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Type</th>
              <th>Stock</th>
              <th>Qty.</th>
              <th>Avg.Price</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{Date.now()}</td>
              <td>Buy</td>
              <td>UPWK</td>
              <td>20</td>
              <td>22.5</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Orders;
