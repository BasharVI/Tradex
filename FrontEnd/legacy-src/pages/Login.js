import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api, auth } from "../lib/api";
import SocialLogin from "../components/auth/SocialLogin";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (auth.user && auth.access) navigate("/dashboard");
  }, [navigate]);

  const handleSuccess = (data) => {
    if (data?.user?.onboarding && !data.user.onboarding.completed) {
      navigate("/onboarding");
    } else {
      navigate("/dashboard");
    }
  };

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
      handleSuccess(data);
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h3>Welcome back</h3>
        <p className="muted">Sign in to your TradeX account</p>
        {error && <div className="error">{error}</div>}

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
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="auth-row">
          <Link to="/forgot-password" className="link-sm">Forgot password?</Link>
        </div>

        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Signing in..." : "Sign in"}
        </button>

        <SocialLogin onSuccess={handleSuccess} onError={setError} />

        <p className="auth-footer">
          New to TradeX? <Link to="/signup">Create an account</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
