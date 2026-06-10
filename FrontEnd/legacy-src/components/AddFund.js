import React, { useEffect, useState } from "react";
import { api, formatINR } from "../lib/api";

const AddFund = () => {
  const [capital, setCapital] = useState(null);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const data = await api("/funds");
      setCapital(data.capital);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const deposit = async (e) => {
    e.preventDefault();
    setError("");
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return setError("Enter a positive amount");
    setSubmitting(true);
    try {
      await api("/funds/deposit", { method: "POST", body: { amount: n } });
      setAmount("");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="account-balance" style={{ background: "#fff", padding: 16, borderRadius: 6, border: "1px solid #eee" }}>
      <h3>Virtual Capital</h3>
      {capital && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8, marginBottom: 12 }}>
          <div>Starting Capital: <b>{formatINR(capital.startingCapital)}</b></div>
          <div>Available Cash: <b>{formatINR(capital.availableCash)}</b></div>
          <div>Invested: <b>{formatINR(capital.investedAmount)}</b></div>
          <div>Realized P&L: <b style={{ color: capital.realizedPnL >= 0 ? "green" : "crimson" }}>{formatINR(capital.realizedPnL)}</b></div>
        </div>
      )}
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <form onSubmit={deposit}>
        <label>Top up virtual cash</label>
        <input
          type="number"
          min="0"
          step="100"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount in ₹"
        />
        <button type="submit" disabled={submitting}>
          {submitting ? "Adding..." : "Add Funds"}
        </button>
      </form>
    </div>
  );
};

export default AddFund;
