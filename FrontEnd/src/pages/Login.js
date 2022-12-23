import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
  const [email, setemail] = useState("");
  const [password, setpassword] = useState("");

  const users = JSON.parse(localStorage.getItem("user"));

  const navigate = useNavigate();
  const handleSubmit = (e) => {
    e.preventDefault();
    if (users.email === email && users.password === password) {
      navigate("/dashboard");
    } else {
      console.log("wrong credentials");
      navigate("/login");
    }
  };

  return (
    <div className="login-page">
      <form onSubmit={handleSubmit}>
        <h3>Login</h3>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          className="input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setemail(e.target.value)}
        />
        <label className="label" htmlFor="password">
          Password
        </label>
        <input
          className="input"
          type="password"
          placeholder="Password"
          onChange={(e) => setpassword(e.target.value)}
        />
        <button className="btn" type="submit">
          Login
        </button>
        <p>
          Need an account ? <br />
          <Link to="/signup">SignUp here</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
