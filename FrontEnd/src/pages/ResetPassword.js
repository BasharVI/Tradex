import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";

const ResetPassword = () => {
  const [params] = useSearchParams();
  const email = params.get("email") || "";
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setError("Password must be 8+ characters and include letters and digits");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setSubmitting(true);
    try {
      await api("/auth/reset-password", {
        method: "POST",
        body: { email, token, password },
      });
      setDone(true);
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.message || "Reset failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (!email || !token) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h3>Invalid reset link</h3>
          <p>This link is missing required information. Request a new one.</p>
          <Link to="/forgot-password" className="btn btn-primary">Get a new link</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <h3>Choose a new password</h3>
        {done ? (
          <p>Password updated. Redirecting to sign in…</p>
        ) : (
          <>
            <p className="muted">Resetting password for <b>{email}</b></p>
            {error && <div className="error">{error}</div>}
            <label className="label" htmlFor="pw">New password</label>
            <input
              id="pw"
              className="input"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <label className="label" htmlFor="pw2">Confirm password</label>
            <input
              id="pw2"
              className="input"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? "Updating..." : "Update password"}
            </button>
          </>
        )}
      </form>
    </div>
  );
};

export default ResetPassword;
