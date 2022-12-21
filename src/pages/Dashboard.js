import { Navigate } from "react-router-dom";
import Watchlist from "../components/Watchlist";

const Dashboard = () => {
  const authenticated = true;

  if (!authenticated) {
    return <Navigate replace to="/login" />;
  } else {
    return <Watchlist />;
  }
};

export default Dashboard;
