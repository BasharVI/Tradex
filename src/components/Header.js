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
        <li>
          {loggedInUser ? (
            <Link onClick={logout}>Log out</Link>
          ) : (
            <Link to="/login">Login</Link>
          )}
        </li>
        <li>{loggedInUser ? <div></div> : <Link to="/signup">SignUp</Link>}</li>
        <li>{loggedInUser ? loggedInUser.username : <div></div>}</li>
      </ul>
    </div>
  );
};

export default Header;
