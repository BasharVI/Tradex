import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Signup = () => {
  const [username, setUserName] = useState("");
  const [email, setemail] = useState("");
  const [password, setpassword] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const auth = localStorage.getItem("user");
    if (auth) {
      navigate("/dashboard");
    }
  });

  const collectData = async (e) => {
    e.preventDefault();
    let result = await fetch("http://localhost:5000/signup", {
      method: "post",
      body: JSON.stringify({ username, email, password }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    result = await result.json();
    console.log(result);
    localStorage.setItem("user", JSON.stringify(result));
    navigate("/dashboard");
  };

  return (
    <div className="signup-page">
      <form onSubmit={collectData}>
        <h3>Create new account</h3>
        <label className="label" htmlFor="userName">
          User Name
        </label>
        <input
          className="input"
          type="text"
          placeholder="User Name"
          value={username}
          onChange={(e) => setUserName(e.target.value)}
        />
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
          value={password}
          onChange={(e) => setpassword(e.target.value)}
        />
        <button className="btn" type="submit">
          Sign Up
        </button>
        <p>
          Already have an account ? <br />
          <Link to="/login">Login here</Link>
        </p>
      </form>
    </div>
  );
};

export default Signup;
