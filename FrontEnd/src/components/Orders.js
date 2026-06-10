import React, { useEffect, useState } from "react";
import Watchlist from "./Watchlist";
import { api } from "../lib/api";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await api("/orders");
        setOrders(data.orderHistory || []);
      } catch (err) {
        setError(err.message);
      }
    })();
  }, []);

  return (
    <div className="orders">
      <Watchlist />
      <div className="orders-details">
        <h2>Orders</h2>
        {error && <p style={{ color: "crimson" }}>{error}</p>}
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
            {orders.map((order, i) => (
              <tr key={order._id || i}>
                <td>{new Date(order.orderDate).toLocaleString()}</td>
                <td>{order.orderType}</td>
                <td>{order.symbol || order.stockName}</td>
                <td>{order.quantity}</td>
                <td>${Number(order.orderPrice || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Orders;
