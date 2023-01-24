import React, { useEffect, useState } from "react";

const AddFund = () => {
  const [fund, setFund] = useState("");
  const [balance, setBalance] = useState("");
  const userId = JSON.parse(localStorage.getItem("user"))._id;

  useEffect(() => {
    (async () => {
      const result = await fetch(
        `http://localhost:5000/addfund?userId=${userId}`
      );
      const { fund } = await result.json();
      setBalance(fund);
    })();
  }, [userId, fund]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await fetch("http://localhost:5000/addfund", {
      method: "post",
      body: JSON.stringify({ userId, fund }),
      headers: { "Content-Type": "application/json" },
    });
    const { fund: newFund } = await result.json();
    setBalance(newFund);
    setFund("");
  };

  return (
    <div className="account-balance">
      <h3>Account Balance : ${balance}</h3>
      <form onSubmit={handleSubmit}>
        <label>Enter Amount</label>
        <input
          type="number"
          value={fund}
          onChange={(e) => setFund(e.target.value)}
          placeholder="Enter amount"
        />
        <button type="submit">Add Fund</button>
      </form>
    </div>
  );
};

export default AddFund;
