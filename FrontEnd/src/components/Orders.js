import React, { useEffect, useState } from "react";
import Watchlist from "./Watchlist";

const Orders = () => {
  const [details, setdetails] = useState([]);
  const userId = JSON.parse(localStorage.getItem("user"))._id;

  useEffect(() => {
    (async () => {
      let result = await fetch(
        `http://localhost:5000/orders?userId=${userId}`,
        {
          method: "get",
          headers: { "Content-Type": "application/json" },
        }
      );
      result = await result.json();
      const orders = result.orderHistory;
      setdetails(orders);
    })();
  });

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
            {details.length > 0 &&
              details.map((order, i) => (
                <tr key={i}>
                  <td>{order.orderDate}</td>
                  <td>{order.orderType}</td>
                  <td>{order.stockName}</td>
                  <td>{order.quantity}</td>
                  <td>{order.orderPrice}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Orders;
