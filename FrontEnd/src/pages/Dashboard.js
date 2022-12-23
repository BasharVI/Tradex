import { Navigate } from "react-router-dom";
import Watchlist from "../components/Watchlist";

const Dashboard = () => {
  const isLoggedIn = localStorage.getItem("user");

  if (!isLoggedIn) {
    return <Navigate replace to="/login" />;
  } else {
    return <Watchlist />;
  }
};

export default Dashboard;
