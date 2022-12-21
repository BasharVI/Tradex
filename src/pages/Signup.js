import React from "react";

const Signup = () => {
  return (
    <div className="signup-page">
      <form>
        <h3>Create new account</h3>
        <label className="label" htmlFor="userName">
          User Name
        </label>
        <input className="input" type="text" placeholder="User Name" />
        <label className="label" htmlFor="email">
          Email
        </label>
        <input className="input" type="email" placeholder="Email" />
        <label className="label" htmlFor="password">
          Password
        </label>
        <input className="input" type="password" placeholder="Password" />
        <button className="btn" type="submit">
          Sign Up
        </button>
      </form>
    </div>
  );
};

export default Signup;
