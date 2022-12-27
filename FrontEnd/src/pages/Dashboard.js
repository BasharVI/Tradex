import React from "react";
import Watchlist from "../components/Watchlist";

const Dashboard = () => {
  const loggedInUser = JSON.parse(localStorage.getItem("user"));
  console.log(loggedInUser.username);
  return (
    <div className="dashboard">
      <Watchlist />
      <div className="dash-content">
        <h1>Welcome {loggedInUser.username}</h1>
        <h2>Add stocks to Watchlist</h2>
      </div>
    </div>
  );
};

export default Dashboard;
