import React from "react";
import { useNavigate } from "react-router-dom";
import AddFund from "../components/AddFund";
import Watchlist from "../components/Watchlist";

const Dashboard = () => {
  const loggedInUser = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();
  if (!loggedInUser) {
    navigate("/login");
    return null;
  }
  return (
    <div className="dashboard">
      <Watchlist />
      <div className="dash-content">
        <h1>Welcome {loggedInUser.username}</h1>
        {/* <h2>Add stocks to Watchlist</h2> */}
        <AddFund />
      </div>
    </div>
  );
};

export default Dashboard;
