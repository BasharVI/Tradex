import React from "react";
import { Link, useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();

  const logout = (e) => {
    e.preventDefault();
    localStorage.clear();
    navigate("/login");
  };

  const loggedInUser = JSON.parse(localStorage.getItem("user"));
  return (
    <div className="header">
      <h1 className="logo">
        <Link to="/">TradeX</Link>
      </h1>
      <ul>
        <li>{loggedInUser ? <Link to="/dashboard">Dashboard</Link> : null}</li>
        <li>{loggedInUser ? <Link to="/portfolio">Portfolio</Link> : null}</li>
        <li>{loggedInUser ? <Link to="/orders">Orders</Link> : null}</li>

        <li>
          {loggedInUser ? (
            <Link onClick={logout}>Log out</Link>
          ) : (
            <Link to="/login">Login</Link>
          )}
        </li>
        <li>
          {loggedInUser ? (
            loggedInUser.username
          ) : (
            <Link to="/signup">SignUp</Link>
          )}
        </li>
      </ul>
    </div>
  );
};

export default Header;
