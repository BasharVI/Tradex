import React, { useEffect, useMemo, useState } from "react";
import { api, auth, formatINR, formatPct } from "../lib/api";

const initialForm = {
  tradeId: "",
  orderId: "",
  symbol: "",
  exchange: "NSE",
  side: "BUY",
  executedAt: "",
  tradeSetup: "",
  entryReason: "",
  exitReason: "",
  riskLevel: "MEDIUM",
  emotion: "CALM",
  notes: "",
};

const Section = ({ title, action, children }) => (
  <section className="growth-card">
    <div className="growth-card-header">
      <h3>{title}</h3>
      {action}
    </div>
    {children}
  </section>
);

const Pill = ({ children, tone = "neutral" }) => (
  <span className={`growth-pill growth-pill-${tone}`}>{children}</span>
);

const GrowthHub = () => {
  const user = auth.user;
  const [snapshot, setSnapshot] = useState(null);
  const [journals, setJournals] = useState([]);
  const [trades, setTrades] = useState([]);
  const [riskHistory, setRiskHistory] = useState([]);
  const [leaderboards, setLeaderboards] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      const snapshotResp = await api("/retention/snapshot");
      const [
        journalsResp,
        tradesResp,
        riskResp,
        leadersResp,
        challengesResp,
        achievementsResp,
        notificationsResp,
      ] = await Promise.all([
        api("/retention/journals"),
        api("/portfolio/trades?limit=50"),
        api("/retention/risk-score/history"),
        api(`/retention/leaderboards?month=${month}`),
        api("/retention/challenges"),
        api("/retention/achievements"),
        api("/retention/notifications"),
      ]);

      setSnapshot(snapshotResp.snapshot);
      setJournals(journalsResp.journals || []);
      setTrades(tradesResp.trades || []);
      setRiskHistory(riskResp.history || []);
      setLeaderboards(leadersResp.leaderboards);
      setChallenges(challengesResp.challenges || []);
      setAchievements(achievementsResp.achievements || []);
      setNotifications(notificationsResp.notifications || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, month]);

  const selectedTrade = useMemo(
    () => trades.find((trade) => String(trade._id) === form.tradeId),
    [form.tradeId, trades]
  );

  useEffect(() => {
    if (!selectedTrade) return;
    setForm((curr) => ({
      ...curr,
      tradeId: String(selectedTrade._id),
      orderId: selectedTrade.orderId || "",
      symbol: selectedTrade.symbol || "",
      exchange: selectedTrade.exchange || "NSE",
      side: selectedTrade.side || "BUY",
      executedAt: selectedTrade.executedAt
        ? new Date(selectedTrade.executedAt).toISOString().slice(0, 16)
        : "",
    }));
  }, [selectedTrade]);

  const update = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  const submitJournal = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      if (editingId) {
        await api(`/retention/journals/${editingId}`, { method: "PATCH", body: form });
        setMessage("Journal updated.");
      } else {
        await api("/retention/journals", { method: "POST", body: form });
        setMessage("Journal saved.");
      }
      setForm(initialForm);
      setEditingId("");
      refresh();
    } catch (err) {
      setError(err.message);
    }
  };

  const loadJournal = (journal) => {
    setEditingId(journal._id);
    setForm({
      tradeId: String(journal.tradeId || ""),
      orderId: String(journal.orderId || ""),
      symbol: journal.symbol || "",
      exchange: journal.exchange || "NSE",
      side: journal.side || "BUY",
      executedAt: journal.executedAt ? new Date(journal.executedAt).toISOString().slice(0, 16) : "",
      tradeSetup: journal.tradeSetup || "",
      entryReason: journal.entryReason || "",
      exitReason: journal.exitReason || "",
      riskLevel: journal.riskLevel || "MEDIUM",
      emotion: journal.emotion || "CALM",
      notes: journal.notes || "",
    });
  };

  const learningCheckin = async () => {
    setMessage("");
    setError("");
    try {
      await api("/retention/learning/checkin", { method: "POST", body: {} });
      setMessage("Learning streak updated.");
      refresh();
    } catch (err) {
      setError(err.message);
    }
  };

  const markRead = async (notification) => {
    if (notification.readAt) return;
    try {
      await api(`/retention/notifications/${notification._id}/read`, { method: "PATCH" });
      setNotifications((current) =>
        current.map((item) =>
          String(item._id) === String(notification._id)
            ? { ...item, readAt: new Date().toISOString() }
            : item
        )
      );
    } catch (err) {
      setError(err.message);
    }
  };

  if (!user) return null;

  const streaks = snapshot?.streaks || {};
  const risk = snapshot?.riskScore || {};

  return (
    <div className="growth-hub">
      <div className="growth-hero">
        <div>
          <h1>Growth Hub</h1>
          <p>Build the habit loop: journal, score, streak, compete, repeat.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={refresh} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {message && <div className="success">{message}</div>}
      {error && <div className="error">{error}</div>}

      <div className="growth-grid">
        <Section title="Engagement Score">
          <div className="growth-metrics">
            <div><strong>{risk.score ?? 0}</strong><span>Risk score</span></div>
            <div><strong>{streaks.rewardPoints ?? 0}</strong><span>Reward points</span></div>
            <div><strong>{streaks.login?.count || 0}</strong><span>Login streak</span></div>
            <div><strong>{streaks.trading?.count || 0}</strong><span>Trading streak</span></div>
            <div><strong>{streaks.greenDay?.count || 0}</strong><span>Green day streak</span></div>
            <div><strong>{streaks.learning?.count || 0}</strong><span>Learning streak</span></div>
          </div>
          {risk.metrics && (
            <div className="growth-subgrid">
              <div>Win rate: {formatPct(risk.metrics.winRate)}</div>
              <div>Profit factor: {risk.metrics.profitFactor}</div>
              <div>Avg RR: {risk.metrics.averageRiskReward}</div>
              <div>Max drawdown: {formatPct(risk.metrics.maxDrawdown)}</div>
              <div>Position discipline: {formatPct(risk.metrics.positionSizingDiscipline)}</div>
            </div>
          )}
        </Section>

        <Section
          title="Learning Streak"
          action={<button type="button" className="btn btn-ghost" onClick={learningCheckin}>Check in</button>}
        >
          <p className="muted">Mark a lesson, article, or review session to keep the learning streak alive.</p>
        </Section>
      </div>

      <div className="growth-grid growth-grid-2">
        <Section title="Trade Journal">
          <form onSubmit={submitJournal}>
            <label className="label">Recent trade</label>
            <select className="input" value={form.tradeId} onChange={update("tradeId")}>
              <option value="">Select a trade</option>
              {trades.map((trade) => (
                <option key={trade._id} value={trade._id}>
                  {trade.symbol} · {trade.side} · {formatINR(trade.price || 0)}
                </option>
              ))}
            </select>

            <div className="growth-inline">
              <div>
                <label className="label">Setup</label>
                <input className="input" value={form.tradeSetup} onChange={update("tradeSetup")} />
              </div>
              <div>
                <label className="label">Risk</label>
                <select className="input" value={form.riskLevel} onChange={update("riskLevel")}>
                  <option>LOW</option>
                  <option>MEDIUM</option>
                  <option>HIGH</option>
                  <option>EXTREME</option>
                </select>
              </div>
            </div>

            <label className="label">Entry reason</label>
            <textarea className="input" rows={3} value={form.entryReason} onChange={update("entryReason")} />
            <label className="label">Exit reason</label>
            <textarea className="input" rows={3} value={form.exitReason} onChange={update("exitReason")} />
            <label className="label">Emotion</label>
            <select className="input" value={form.emotion} onChange={update("emotion")}>
              {["CALM", "CONFIDENT", "ANXIOUS", "GREEDY", "FEARFUL", "IMPULSIVE", "DISCIPLINED"].map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
            <label className="label">Notes</label>
            <textarea className="input" rows={4} value={form.notes} onChange={update("notes")} />
            <button className="btn btn-primary" type="submit">
              {editingId ? "Update Journal" : "Save Journal"}
            </button>
          </form>

          <div className="growth-list">
            {journals.map((journal) => (
              <button type="button" key={journal._id} className="growth-item" onClick={() => loadJournal(journal)}>
                <strong>{journal.symbol}</strong>
                <span>{journal.tradeSetup || "No setup"}</span>
              </button>
            ))}
          </div>
        </Section>

        <Section title="Daily Challenges">
          {challenges.map((challenge) => (
            <div key={challenge._id} className="growth-row">
              <div>
                <strong>{challenge.title}</strong>
                <p className="muted">{challenge.description}</p>
              </div>
              <div className="growth-row-right">
                <Pill tone={challenge.completed ? "success" : "neutral"}>
                  {challenge.completed
                    ? "Complete"
                    : `${challenge.progress || 0}/${challenge.targetValue} ${challenge.unit}`}
                </Pill>
                <small>{challenge.rewardPoints} pts</small>
              </div>
            </div>
          ))}
        </Section>
      </div>

      <div className="growth-grid growth-grid-3">
        <Section title="Achievements">
          {achievements.map((achievement) => (
            <div key={achievement._id} className="growth-row">
              <div>
                <strong>{achievement.title}</strong>
                <p className="muted">{achievement.description}</p>
              </div>
              <Pill tone={achievement.unlocked ? "success" : "neutral"}>
                {achievement.unlocked ? "Unlocked" : "Locked"}
              </Pill>
            </div>
          ))}
        </Section>

        <Section
          title="Leaderboard"
          action={
            <input
              className="input growth-month"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          }
        >
          {leaderboards && (
            <>
              <h4>Highest Return</h4>
              {leaderboards.highestReturn.map((row) => (
                <div key={row.userId} className="growth-row">
                  <strong>{row.username}</strong>
                  <span>{formatPct(row.returnPct)}</span>
                </div>
              ))}
              <h4>Highest Risk Adjusted Return</h4>
              {leaderboards.highestRiskAdjustedReturn.map((row) => (
                <div key={row.userId} className="growth-row">
                  <strong>{row.username}</strong>
                  <span>{row.riskAdjustedReturn}</span>
                </div>
              ))}
              <h4>Best Consistency</h4>
              {leaderboards.bestConsistency.map((row) => (
                <div key={row.userId} className="growth-row">
                  <strong>{row.username}</strong>
                  <span>{row.consistency}</span>
                </div>
              ))}
            </>
          )}
        </Section>

        <Section title="Notifications">
          {notifications.map((notification) => (
            <button
              type="button"
              key={notification._id}
              className={`growth-item growth-item-notification ${notification.readAt ? "read" : ""}`}
              onClick={() => markRead(notification)}
            >
              <div className="growth-row">
                <strong>{notification.title}</strong>
                <Pill tone={notification.readAt ? "neutral" : "success"}>
                  {notification.readAt ? "Read" : "New"}
                </Pill>
              </div>
              <span>{notification.message}</span>
            </button>
          ))}
        </Section>
      </div>

      <Section title="Risk Score History">
        <div className="growth-list">
          {riskHistory.map((entry) => (
            <div key={entry._id} className="growth-row">
              <div>
                <strong>{new Date(entry.periodEnd).toLocaleDateString()}</strong>
                <p className="muted">
                  Win {formatPct(entry.metrics?.winRate)} · PF {entry.metrics?.profitFactor} · DD{" "}
                  {formatPct(entry.metrics?.maxDrawdown)}
                </p>
              </div>
              <Pill tone="neutral">{entry.score}</Pill>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
};

export default GrowthHub;
