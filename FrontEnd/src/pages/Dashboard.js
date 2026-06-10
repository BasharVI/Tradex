import React from "react";
import { useNavigate } from "react-router-dom";
import AddFund from "../components/AddFund";
import Watchlist from "../components/Watchlist";
import { auth } from "../lib/api";

const Dashboard = () => {
  const navigate = useNavigate();
  const user = auth.user;
  if (!user) {
    navigate("/login");
    return null;
  }
  return (
    <div className="dashboard">
      <Watchlist />
      <div className="dash-content">
        <h1>Welcome {user.username}</h1>
        <AddFund />
      </div>
    </div>
  );
};

export default Dashboard;
