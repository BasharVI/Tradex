import React, { useEffect, useState } from "react";
import Watchlist from "./Watchlist";
import { api, formatINR } from "../lib/api";

const statusColor = {
  EXECUTED: "green",
  PARTIALLY_FILLED: "orange",
  PENDING: "#888",
  REJECTED: "crimson",
  CANCELLED: "#888",
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const data = await api("/orders");
      setOrders(data.orders || []);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const cancel = async (id) => {
    try {
      await api(`/orders/${id}/cancel`, { method: "POST" });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

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
              <th>Symbol</th>
              <th>Exch</th>
              <th>Side</th>
              <th>Type</th>
              <th>Product</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o._id}>
                <td>{new Date(o.placedAt).toLocaleString()}</td>
                <td>{o.symbol}</td>
                <td>{o.exchange}</td>
                <td>{o.side}</td>
                <td>{o.orderType}</td>
                <td>{o.productType}</td>
                <td>{o.quantity}</td>
                <td>{formatINR(o.avgFillPrice || o.limitPrice || 0)}</td>
                <td style={{ color: statusColor[o.status] }}>{o.status}</td>
                <td>
                  {o.status === "PENDING" && (
                    <button onClick={() => cancel(o._id)}>Cancel</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Orders;
