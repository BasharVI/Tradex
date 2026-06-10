import React, { useEffect, useState } from "react";
import { api, auth } from "../lib/api";

const EXPERIENCE = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];
const RISK = ["LOW", "MEDIUM", "HIGH"];

const Profile = () => {
  const [user, setUser] = useState(auth.user);
  const [form, setForm] = useState({
    displayName: user?.displayName || "",
    bio: user?.bio || "",
    photoUrl: user?.photoUrl || "",
    experienceLevel: user?.experienceLevel || "",
    riskAppetite: user?.riskAppetite || "",
  });
  const [sessions, setSessions] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const reload = async () => {
    try {
      const [profileResp, sessionsResp] = await Promise.all([
        api("/profile"),
        api("/auth/sessions"),
      ]);
      setUser(profileResp.user);
      auth.setUser(profileResp.user);
      setSessions(sessionsResp.sessions || []);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setMsg("");
    setError("");
    setBusy(true);
    try {
      const data = await api("/profile", { method: "PATCH", body: form });
      setUser(data.user);
      auth.setUser(data.user);
      setMsg("Saved.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (id) => {
    try {
      await api(`/auth/sessions/${id}`, { method: "DELETE" });
      setSessions((curr) => curr.filter((s) => s.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const revokeAll = async () => {
    if (!window.confirm("Sign out of every device? You'll need to log in again here.")) return;
    try {
      await api("/auth/sessions/revoke-all", { method: "POST" });
      auth.clear();
      window.location.href = "/login";
    } catch (err) {
      setError(err.message);
    }
  };

  const resendVerify = async () => {
    setMsg("");
    setError("");
    try {
      await api("/auth/resend-verification", {
        method: "POST",
        body: { email: user.email },
      });
      setMsg("Verification email sent (if your address is unverified).");
    } catch (err) {
      setError(err.message);
    }
  };

  if (!user) return <div className="profile-page">Loading…</div>;

  return (
    <div className="profile-page">
      <h2>Profile</h2>

      {msg && <div className="success">{msg}</div>}
      {error && <div className="error">{error}</div>}

      {!user.emailVerified && (
        <div className="banner">
          <span>Your email is not verified.</span>
          <button className="btn btn-ghost" onClick={resendVerify}>Resend link</button>
        </div>
      )}

      <form className="profile-card" onSubmit={save}>
        <div className="profile-photo">
          {form.photoUrl ? (
            <img src={form.photoUrl} alt="" />
          ) : (
            <div className="profile-photo-placeholder">{(form.displayName || user.email || "U").charAt(0).toUpperCase()}</div>
          )}
        </div>

        <label className="label">Display name</label>
        <input className="input" value={form.displayName} onChange={update("displayName")} />

        <label className="label">Bio</label>
        <textarea
          className="input"
          rows={3}
          maxLength={280}
          value={form.bio}
          onChange={update("bio")}
        />

        <label className="label">Photo URL</label>
        <input className="input" value={form.photoUrl} onChange={update("photoUrl")} />

        <label className="label">Experience level</label>
        <select className="input" value={form.experienceLevel} onChange={update("experienceLevel")}>
          <option value="">— select —</option>
          {EXPERIENCE.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>

        <label className="label">Risk appetite</label>
        <select className="input" value={form.riskAppetite} onChange={update("riskAppetite")}>
          <option value="">— select —</option>
          {RISK.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>

        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? "Saving..." : "Save changes"}
        </button>
      </form>

      <section className="sessions-section">
        <div className="sessions-header">
          <h3>Active sessions</h3>
          <button className="btn btn-ghost" onClick={revokeAll}>Sign out everywhere</button>
        </div>
        {sessions.length === 0 ? (
          <p className="muted">No active sessions found.</p>
        ) : (
          <ul className="sessions-list">
            {sessions.map((s) => (
              <li key={s.id}>
                <div>
                  <strong>{s.device || "Unknown device"}</strong>
                  <div className="muted">
                    {s.ip || "—"} · last used {new Date(s.lastUsedAt).toLocaleString()}
                  </div>
                </div>
                <button className="btn btn-ghost" onClick={() => revoke(s.id)}>Revoke</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default Profile;
