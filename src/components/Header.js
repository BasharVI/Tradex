import React from "react";
import { BrowserRouter as Router, Link } from "react-router-dom";

const Header = () => {
  return (
    <Router>
      <div className="header">
        <ul>
          <li>
            <Link to="/login">Login</Link>
          </li>
          <li>
            <Link to="/signup">SignUp</Link>
          </li>
        </ul>
      </div>
    </Router>
  );
};

export default Header;
