import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, auth, formatINR } from "../lib/api";

// 5-step wizard. State is held client-side until each step's `Continue`
// is clicked, then persisted to the server so a refresh / device switch
// resumes from the last saved step.

const EXPERIENCE = [
  { value: "BEGINNER", label: "Beginner", hint: "New to markets" },
  { value: "INTERMEDIATE", label: "Intermediate", hint: "Some trading experience" },
  { value: "ADVANCED", label: "Advanced", hint: "Active trader / investor" },
];

const GOAL_OPTIONS = [
  { value: "LEARN_INVESTING", label: "Learn Investing" },
  { value: "LEARN_TRADING", label: "Learn Trading" },
  { value: "BUILD_PORTFOLIO", label: "Build Portfolio" },
  { value: "COMPETE_WITH_OTHERS", label: "Compete With Others" },
];

const RISK = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
];

const DEFAULT_CAPITAL = 1_000_000;

const Onboarding = () => {
  const navigate = useNavigate();
  const initialUser = auth.user || {};
  const [step, setStep] = useState(Math.max(1, (initialUser.onboarding?.step || 0) + 1));
  const [experienceLevel, setExperienceLevel] = useState(initialUser.experienceLevel || "");
  const [goals, setGoals] = useState(initialUser.goals || []);
  const [capital, setCapital] = useState(initialUser.startingCapital || DEFAULT_CAPITAL);
  const [displayName, setDisplayName] = useState(initialUser.displayName || initialUser.username || "");
  const [bio, setBio] = useState(initialUser.bio || "");
  const [photoUrl, setPhotoUrl] = useState(initialUser.photoUrl || "");
  const [riskAppetite, setRiskAppetite] = useState(initialUser.riskAppetite || "MEDIUM");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialUser.onboarding?.completed) navigate("/dashboard");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async (payload) => {
    setBusy(true);
    setError("");
    try {
      const data = await api("/auth/onboarding", { method: "POST", body: payload });
      auth.setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message || "Could not save");
      return null;
    } finally {
      setBusy(false);
    }
  };

  const next = async (payload) => {
    const user = await save(payload);
    if (user) setStep((s) => Math.min(5, s + 1));
  };

  const finish = async () => {
    const user = await save({
      step: 5,
      displayName,
      bio,
      photoUrl,
      riskAppetite,
      completed: true,
    });
    if (user) navigate("/dashboard");
  };

  const toggleGoal = (value) =>
    setGoals((curr) =>
      curr.includes(value) ? curr.filter((v) => v !== value) : [...curr, value]
    );

  return (
    <div className="onboarding">
      <div className="onboarding-card">
        <div className="onboarding-progress">
          {[1, 2, 3, 4, 5].map((s) => (
            <span key={s} className={`step ${s === step ? "active" : ""} ${s < step ? "done" : ""}`}>
              {s}
            </span>
          ))}
        </div>

        {error && <div className="error">{error}</div>}

        {step === 1 && (
          <section>
            <h2>Welcome to TradeX 🎯</h2>
            <p>
              Learn to trade Indian markets risk-free with virtual capital.
              Let's get you set up in under a minute.
            </p>
            <button className="btn btn-primary" onClick={() => next({ step: 1 })} disabled={busy}>
              Let's go
            </button>
          </section>
        )}

        {step === 2 && (
          <section>
            <h2>Your trading experience</h2>
            <p className="muted">We tailor explanations and defaults to your level.</p>
            <div className="choice-grid">
              {EXPERIENCE.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`choice ${experienceLevel === opt.value ? "selected" : ""}`}
                  onClick={() => setExperienceLevel(opt.value)}
                >
                  <strong>{opt.label}</strong>
                  <small>{opt.hint}</small>
                </button>
              ))}
            </div>
            <div className="onboarding-actions">
              <button
                className="btn btn-primary"
                disabled={!experienceLevel || busy}
                onClick={() => next({ step: 2, experienceLevel })}
              >
                Continue
              </button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section>
            <h2>What's your goal?</h2>
            <p className="muted">Choose one or more.</p>
            <div className="choice-grid">
              {GOAL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`choice ${goals.includes(opt.value) ? "selected" : ""}`}
                  onClick={() => toggleGoal(opt.value)}
                >
                  <strong>{opt.label}</strong>
                </button>
              ))}
            </div>
            <div className="onboarding-actions">
              <button className="btn btn-ghost" onClick={() => setStep(2)}>Back</button>
              <button
                className="btn btn-primary"
                disabled={goals.length === 0 || busy}
                onClick={() => next({ step: 3, goals })}
              >
                Continue
              </button>
            </div>
          </section>
        )}

        {step === 4 && (
          <section>
            <h2>Allocate virtual capital</h2>
            <p className="muted">
              Default is {formatINR(DEFAULT_CAPITAL)}. You can adjust this once
              before you start trading.
            </p>
            <input
              type="range"
              min="100000"
              max="10000000"
              step="100000"
              value={capital}
              onChange={(e) => setCapital(Number(e.target.value))}
              style={{ width: "100%" }}
            />
            <div className="capital-readout">{formatINR(capital)}</div>
            <div className="onboarding-actions">
              <button className="btn btn-ghost" onClick={() => setStep(3)}>Back</button>
              <button
                className="btn btn-primary"
                disabled={busy}
                onClick={() => next({ step: 4, startingCapital: capital })}
              >
                Continue
              </button>
            </div>
          </section>
        )}

        {step === 5 && (
          <section>
            <h2>Complete your profile</h2>
            <p className="muted">You can change any of this later.</p>

            <label className="label">Display name</label>
            <input className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />

            <label className="label">Bio</label>
            <textarea
              className="input"
              rows={3}
              maxLength={280}
              placeholder="A short intro (optional)"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />

            <label className="label">Profile photo URL</label>
            <input
              className="input"
              placeholder="https://…"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
            />

            <label className="label">Risk appetite</label>
            <div className="choice-grid">
              {RISK.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  className={`choice ${riskAppetite === r.value ? "selected" : ""}`}
                  onClick={() => setRiskAppetite(r.value)}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <div className="onboarding-actions">
              <button className="btn btn-ghost" onClick={() => setStep(4)}>Back</button>
              <button className="btn btn-primary" disabled={busy} onClick={finish}>
                {busy ? "Finishing..." : "Finish"}
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
