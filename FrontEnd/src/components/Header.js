import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, auth } from "../lib/api";

const Header = () => {
  const navigate = useNavigate();
  const user = auth.user;

  const logout = async (e) => {
    e.preventDefault();
    try {
      await api("/auth/logout", {
        method: "POST",
        body: { refreshToken: auth.refresh },
      });
    } catch {
      // Best-effort revoke.
    }
    auth.clear();
    navigate("/login");
  };

  return (
    <div className="header">
      <h1 className="logo">
        <Link to="/">TradeX</Link>
        <span style={{ fontSize: 11, color: "#888", marginLeft: 6 }}>IN paper trading</span>
      </h1>
      <ul>
        {user && <li><Link to="/dashboard">Dashboard</Link></li>}
        {user && <li><Link to="/portfolio">Portfolio</Link></li>}
        {user && <li><Link to="/orders">Orders</Link></li>}
        {user && <li><Link to="/allocation">Allocation</Link></li>}
        {user && <li><Link to="/heatmap">Heatmap</Link></li>}
        {user && <li><Link to="/ipo">IPO</Link></li>}
        {user && <li><Link to="/growth">Growth Hub</Link></li>}
        {user && <li><Link to="/profile">Profile</Link></li>}
        <li>
          {user ? (
            <Link to="/login" onClick={logout}>Log out</Link>
          ) : (
            <Link to="/login">Login</Link>
          )}
        </li>
        <li>
          {user ? (
            <Link to="/profile" className="header-user">
              {user.photoUrl ? (
                <img src={user.photoUrl} alt="" className="avatar" />
              ) : null}
              {user.displayName || user.username}
            </Link>
          ) : (
            <Link to="/signup">SignUp</Link>
          )}
        </li>
      </ul>
    </div>
  );
};

export default Header;
