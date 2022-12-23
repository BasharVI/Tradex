// import { Navigate } from "react-router-dom";
import React from "react";
import Watchlist from "../components/Watchlist";

const Dashboard = () => {
  // const isLoggedIn = localStorage.getItem("user");

  // if (!isLoggedIn) {
  //   return <Navigate replace to="/login" />;
  // } else {
  //   return <Watchlist />;
  // }
  return <Watchlist />;
};

export default Dashboard;
