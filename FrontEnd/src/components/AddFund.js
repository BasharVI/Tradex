import React, { useEffect, useState } from "react";
import { api } from "../lib/api";

const AddFund = () => {
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState(0);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const data = await api("/funds");
      setBalance(data.fund || 0);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      setError("Enter a positive amount");
      return;
    }
    setSubmitting(true);
    try {
      const data = await api("/funds", { method: "POST", body: { amount: n } });
      setBalance(data.fund);
      setAmount("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="account-balance">
      <h3>Account Balance : ${Number(balance).toFixed(2)}</h3>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <label>Enter Amount</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
        />
        <button type="submit" disabled={submitting}>
          {submitting ? "Adding..." : "Add Fund"}
        </button>
      </form>
    </div>
  );
};

export default AddFund;
