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
      <ul>
        <li>{loggedInUser ? <Link>Dashboard</Link> : null}</li>
        <li>{loggedInUser ? <Link>Portfolio</Link> : null}</li>

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
