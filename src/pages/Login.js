import React from "react";

const Login = () => {
  return (
    <div className="login-page">
      <form>
        <h3>Login</h3>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input className="input" type="email" placeholder="Email" />
        <label className="label" htmlFor="password">
          Password
        </label>
        <input className="input" type="password" placeholder="Password" />
        <button className="btn" type="submit">
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;
