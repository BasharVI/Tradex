import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, auth } from "../lib/api";

const Signup = () => {
  const [username, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.user && auth.access) navigate("/dashboard");
  }, [navigate]);

  const collectData = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !email || !password) {
      setError("Please fill in all the fields");
      return;
    }
    if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setError("Password must be 8+ characters and include letters and digits");
      return;
    }

    setSubmitting(true);
    try {
      const data = await api("/auth/signup", {
        method: "POST",
        body: { username, email, password },
      });
      auth.set(data);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Sign up failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="signup-page">
      <form onSubmit={collectData}>
        <h3>Create new account</h3>
        {error && <h5 style={{ color: "crimson" }}>{error}</h5>}
        <label className="label" htmlFor="userName">User Name</label>
        <input
          className="input"
          type="text"
          placeholder="User Name"
          value={username}
          onChange={(e) => setUserName(e.target.value)}
        />
        <label className="label" htmlFor="email">Email</label>
        <input
          className="input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <label className="label" htmlFor="password">Password</label>
        <input
          className="input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? "Creating..." : "Sign Up"}
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
