import React, { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api("/auth/forgot-password", { method: "POST", body: { email } });
      // Server never reveals whether the email exists — always say "sent".
      setSent(true);
    } catch (err) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <h3>Reset your password</h3>
        {sent ? (
          <>
            <p>
              If an account exists for <b>{email}</b>, we've sent a reset link.
              The link expires shortly — check your inbox.
            </p>
            <Link to="/login" className="btn btn-primary" style={{ display: "block", textAlign: "center" }}>
              Back to sign in
            </Link>
          </>
        ) : (
          <>
            <p className="muted">Enter the email tied to your account and we'll send a reset link.</p>
            {error && <div className="error">{error}</div>}
            <label className="label" htmlFor="email">Email</label>
            <input
              className="input"
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? "Sending..." : "Send reset link"}
            </button>
            <p className="auth-footer">
              <Link to="/login">Back to sign in</Link>
            </p>
          </>
        )}
      </form>
    </div>
  );
};

export default ForgotPassword;
