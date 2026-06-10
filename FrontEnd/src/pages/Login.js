import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api, auth } from "../lib/api";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (auth.user && auth.access) navigate("/dashboard");
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const data = await api("/auth/login", {
        method: "POST",
        body: { email, password },
      });
      auth.set(data);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <form onSubmit={handleSubmit}>
        <h3>Login</h3>
        {error && <h5 style={{ color: "crimson" }}>{error}</h5>}
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
          {submitting ? "Signing in..." : "Login"}
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
