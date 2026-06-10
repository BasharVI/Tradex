import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, auth } from "../lib/api";
import SocialLogin from "../components/auth/SocialLogin";

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

  const handleSuccess = (data) => {
    // Brand-new signups go straight into onboarding.
    navigate("/onboarding");
  };

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
      handleSuccess(data);
    } catch (err) {
      setError(err.message || "Sign up failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={collectData}>
        <h3>Create your account</h3>
        <p className="muted">Start paper trading with ₹10,00,000 virtual cash</p>
        {error && <div className="error">{error}</div>}

        <label className="label" htmlFor="userName">Full name</label>
        <input
          className="input"
          id="userName"
          type="text"
          autoComplete="name"
          placeholder="Your name"
          value={username}
          onChange={(e) => setUserName(e.target.value)}
        />

        <label className="label" htmlFor="email">Email</label>
        <input
          className="input"
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label className="label" htmlFor="password">Password</label>
        <input
          className="input"
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="8+ chars, letters & digits"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Creating account..." : "Create account"}
        </button>

        <SocialLogin onSuccess={handleSuccess} onError={setError} />

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
};

export default Signup;
