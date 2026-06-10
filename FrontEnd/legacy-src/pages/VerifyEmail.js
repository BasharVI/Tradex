import React, { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, auth } from "../lib/api";

const VerifyEmail = () => {
  const [params] = useSearchParams();
  const email = params.get("email") || "";
  const token = params.get("token") || "";
  const [status, setStatus] = useState("verifying"); // verifying | ok | failed
  const [error, setError] = useState("");
  // React 18 strict mode mounts effects twice in dev — guard against a
  // double-submit so verification doesn't spuriously fail the second call.
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    if (!email || !token) {
      setStatus("failed");
      setError("Verification link is incomplete.");
      return;
    }
    (async () => {
      try {
        const data = await api("/auth/verify-email", {
          method: "POST",
          body: { email, token },
        });
        if (data.user) auth.setUser(data.user);
        setStatus("ok");
      } catch (err) {
        setStatus("failed");
        setError(err.message || "Verification failed");
      }
    })();
  }, [email, token]);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h3>Email verification</h3>
        {status === "verifying" && <p>Verifying your email…</p>}
        {status === "ok" && (
          <>
            <p>Thanks! Your email is verified.</p>
            <Link to={auth.user ? "/dashboard" : "/login"} className="btn btn-primary">
              Continue
            </Link>
          </>
        )}
        {status === "failed" && (
          <>
            <div className="error">{error}</div>
            <Link to="/login" className="btn btn-primary">Back to sign in</Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
