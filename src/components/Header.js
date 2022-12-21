import React from "react";
import { Link } from "react-router-dom";

const Header = () => {
  const loggedInUser = localStorage.getItem("user");
  return (
    <div className="header">
      <ul>
        <li>
          {loggedInUser ? (
            <Link to="/logout">Log out</Link>
          ) : (
            <Link to="/login">Login</Link>
          )}
        </li>
        <li>
          <Link to="/signup">SignUp</Link>
        </li>
        <li>{loggedInUser}</li>
      </ul>
    </div>
  );
};

export default Header;
