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
      // Ignore — best-effort revoke. Local clear below always runs.
    }
    auth.clear();
    navigate("/login");
  };

  return (
    <div className="header">
      <h1 className="logo">
        <Link to="/">TradeX</Link>
      </h1>
      <ul>
        <li>{user ? <Link to="/dashboard">Dashboard</Link> : null}</li>
        <li>{user ? <Link to="/portfolio">Portfolio</Link> : null}</li>
        <li>{user ? <Link to="/orders">Orders</Link> : null}</li>
        <li>
          {user ? (
            <Link to="/login" onClick={logout}>Log out</Link>
          ) : (
            <Link to="/login">Login</Link>
          )}
        </li>
        <li>{user ? user.username : <Link to="/signup">SignUp</Link>}</li>
      </ul>
    </div>
  );
};

export default Header;
