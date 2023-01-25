import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Signup = () => {
  const [username, setUserName] = useState("");
  const [email, setemail] = useState("");
  const [password, setpassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const auth = localStorage.getItem("user");
    if (auth) {
      navigate("/dashboard");
    }
  });

  const collectData = async (e) => {
    e.preventDefault();
    try {
      // Input validation
      if (!username || !email || !password) {
        setError("Please fill in all the fields");
        return;
      }
      if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
        setError("Please enter a valid email address");
        return;
      }

      let result = await fetch("http://localhost:5000/signup", {
        method: "post",
        body: JSON.stringify({ username, email, password }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      result = await result.json();
      localStorage.setItem("user", JSON.stringify(result));
      navigate("/dashboard");
    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.message);
      } else {
        setError("Something went wrong. Please try again later.");
      }
    }
  };

  return (
    <div className="signup-page">
      <form onSubmit={collectData}>
        <h3>Create new account</h3>
        <h5>{error}</h5>
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
