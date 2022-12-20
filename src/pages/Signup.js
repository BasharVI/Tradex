import React from "react";

const Signup = () => {
  return (
    <div className="signup-page">
      <h3>Create new account</h3>
      <form>
        <label className="label" for="userName">
          User Name
        </label>
        <input className="input" type="text" placeholder="User Name" />
        <label className="label" for="email">
          Email
        </label>
        <input className="input" type="email" placeholder="Email" />
        <label className="label" for="password">
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
