import React, { useEffect, useMemo, useState } from "react";
import { api, auth, formatINR, formatPct } from "../lib/api";

const Card = ({ title, action, children }) => (
  <section className="coach-card">
    <div className="coach-header">
      <h3>{title}</h3>
      {action}
    </div>
    {children}
  </section>
);

const Pill = ({ children, tone = "neutral" }) => (
  <span className={`coach-pill coach-pill-${tone}`}>{children}</span>
);

const AICoach = () => {
  const user = auth.user;
  const [overview, setOverview] = useState(null);
  const [trades, setTrades] = useState([]);
  const [selectedTradeId, setSelectedTradeId] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [provider, setProvider] = useState("mock");

  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      const [overviewResp, tradesResp] = await Promise.all([
        api("/ai/overview"),
        api("/portfolio/trades?limit=100"),
      ]);
      setOverview(overviewResp.overview);
      setTrades(tradesResp.trades || []);
      if (!selectedTradeId && tradesResp.trades?.length) {
        setSelectedTradeId(String(tradesResp.trades[0]._id));
      }
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
  }, [user]);

  const selectedTrade = useMemo(
    () => trades.find((trade) => String(trade._id) === selectedTradeId),
    [selectedTradeId, trades]
  );

  const runTradeReview = async () => {
    if (!selectedTrade) return;
    setMessage("");
    try {
      await api(`/ai/trade/${selectedTrade._id}/review`, {
        method: "POST",
        body: { provider, force: true },
      });
      setMessage("Trade review generated.");
      refresh();
    } catch (err) {
      setError(err.message);
    }
  };

  const runPortfolio = async () => {
    setMessage("");
    try {
      await api("/ai/portfolio/review", {
        method: "POST",
        body: { provider, force: true },
      });
      setMessage("Portfolio review generated.");
      refresh();
    } catch (err) {
      setError(err.message);
    }
  };

  const runBehavior = async () => {
    setMessage("");
    try {
      await api("/ai/behavior/analyze", {
        method: "POST",
        body: { provider, force: true },
      });
      setMessage("Behavior analysis generated.");
      refresh();
    } catch (err) {
      setError(err.message);
    }
  };

  const runWeekly = async () => {
    setMessage("");
    try {
      await api("/ai/weekly/generate", {
        method: "POST",
        body: { provider, force: true },
      });
      setMessage("Weekly report generated.");
      refresh();
    } catch (err) {
      setError(err.message);
    }
  };

  const loadLearning = async () => {
    setMessage("");
    try {
      const data = await api(`/ai/learning?provider=${provider}`);
      setOverview((curr) => ({ ...(curr || {}), learning: data.learning }));
      setMessage("Learning coach refreshed.");
    } catch (err) {
      setError(err.message);
    }
  };

  if (!user) return null;

  const latestTradeReview = overview?.latestTradeReview;
  const latestPortfolioReview = overview?.latestPortfolioReview;
  const latestBehavior = overview?.latestBehavior;
  const latestWeekly = overview?.latestWeekly;
  const learning = overview?.learning;

  return (
    <div className="coach-page">
      <div className="coach-hero">
        <div>
          <h1>AI Coach</h1>
          <p>Coaching, pattern detection, and weekly feedback loops in one place.</p>
        </div>
        <div className="coach-actions">
          <select className="input coach-provider" value={provider} onChange={(e) => setProvider(e.target.value)}>
            <option value="mock">Mock</option>
            <option value="openai">OpenAI</option>
            <option value="claude">Claude</option>
            <option value="gemini">Gemini</option>
          </select>
          <button type="button" className="btn btn-primary" onClick={refresh} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {message && <div className="success">{message}</div>}
      {error && <div className="error">{error}</div>}

      <div className="coach-grid">
        <Card
          title="Generate Trade Review"
          action={<button type="button" className="btn btn-ghost" onClick={runTradeReview}>Analyze</button>}
        >
          <label className="label">Recent trade</label>
          <select className="input" value={selectedTradeId} onChange={(e) => setSelectedTradeId(e.target.value)}>
            {trades.map((trade) => (
              <option key={trade._id} value={trade._id}>
                {trade.symbol} · {trade.side} · {formatINR(trade.price || 0)}
              </option>
            ))}
          </select>
          {selectedTrade && (
            <div className="coach-summary">
              <div><strong>{selectedTrade.symbol}</strong> · {selectedTrade.side}</div>
              <div className="muted">{new Date(selectedTrade.executedAt).toLocaleString()}</div>
            </div>
          )}
          {latestTradeReview && (
            <div className="coach-panel">
              <div className="coach-meta">
                <Pill tone="success">{latestTradeReview.grade || "B"}</Pill>
                <small>{latestTradeReview.provider} · {latestTradeReview.model}</small>
              </div>
              <p>{latestTradeReview.summary}</p>
              <div className="coach-list">
                <strong>Strengths</strong>
                <ul>{(latestTradeReview.strengths || []).map((item) => <li key={item}>{item}</li>)}</ul>
                <strong>Recommendations</strong>
                <ul>{(latestTradeReview.recommendations || []).map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
            </div>
          )}
        </Card>

        <Card
          title="Portfolio Review"
          action={<button type="button" className="btn btn-ghost" onClick={runPortfolio}>Review</button>}
        >
          {latestPortfolioReview ? (
            <div className="coach-panel">
              <p>{latestPortfolioReview.summary}</p>
              <div className="coach-grid-mini">
                <div>Sector: {JSON.stringify(latestPortfolioReview.sectorConcentration)}</div>
                <div>Industry: {JSON.stringify(latestPortfolioReview.industryConcentration)}</div>
                <div>Diversification: {JSON.stringify(latestPortfolioReview.diversification)}</div>
                <div>Risk: {JSON.stringify(latestPortfolioReview.riskExposure)}</div>
                <div>Cash: {JSON.stringify(latestPortfolioReview.cashAllocation)}</div>
              </div>
              <div className="coach-list">
                <strong>Recommendations</strong>
                <ul>{(latestPortfolioReview.recommendations || []).map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
            </div>
          ) : (
            <p className="muted">Run a portfolio review to get allocation guidance.</p>
          )}
        </Card>

        <Card
          title="Behavior Analysis"
          action={<button type="button" className="btn btn-ghost" onClick={runBehavior}>Detect</button>}
        >
          {latestBehavior ? (
            <div className="coach-panel">
              <div className="coach-metrics">
                <div>Revenge: {latestBehavior.behaviors?.revengeTrading || 0}</div>
                <div>Overtrade: {latestBehavior.behaviors?.overtrading || 0}</div>
                <div>Losers: {latestBehavior.behaviors?.holdingLosersTooLong || 0}</div>
                <div>Winners: {latestBehavior.behaviors?.cuttingWinnersEarly || 0}</div>
                <div>FOMO: {latestBehavior.behaviors?.fomoEntries || 0}</div>
              </div>
              <ul>{(latestBehavior.insights || []).map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
          ) : (
            <p className="muted">Run behavior detection to find recurring mistakes.</p>
          )}
        </Card>

        <Card
          title="Weekly Report"
          action={<button type="button" className="btn btn-ghost" onClick={runWeekly}>Generate</button>}
        >
          {latestWeekly ? (
            <div className="coach-panel">
              <p><strong>Performance</strong> {latestWeekly.performanceSummary}</p>
              <p><strong>Mistakes</strong> {latestWeekly.mistakeSummary}</p>
              <div className="coach-list">
                <strong>Improvement areas</strong>
                <ul>{(latestWeekly.improvementAreas || []).map((item) => <li key={item}>{item}</li>)}</ul>
                <strong>Risk metrics</strong>
                <div>{JSON.stringify(latestWeekly.riskMetrics || {})}</div>
              </div>
            </div>
          ) : (
            <p className="muted">Generate a weekly report to summarize execution.</p>
          )}
        </Card>

        <Card
          title="Learning Coach"
          action={<button type="button" className="btn btn-ghost" onClick={loadLearning}>Recommend</button>}
        >
          {learning ? (
            <div className="coach-panel">
              <p>{learning.summary}</p>
              <div className="coach-list">
                {(learning.recommendations || []).map((item) => (
                  <div key={item.title} className="coach-learning">
                    <strong>{item.title}</strong>
                    <span>{item.reason}</span>
                    <small>{item.format}</small>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="muted">Ask the coach what to study next.</p>
          )}
        </Card>

        <Card title="Latest Risk Snapshot">
          <div className="coach-panel">
            <div className="coach-metrics">
              <div>Win rate: {formatPct(overview?.latestWeekly?.riskMetrics?.winRate || 0)}</div>
              <div>Profit factor: {overview?.latestWeekly?.riskMetrics?.profitFactor || "—"}</div>
              <div>Drawdown: {formatPct(overview?.latestWeekly?.riskMetrics?.maxDrawdown || 0)}</div>
            </div>
            <div className="coach-list">
              <strong>Recent analyses</strong>
              <ul>
                {(overview?.analyses || []).slice(0, 5).map((analysis) => (
                  <li key={analysis._id}>
                    {analysis.analysisKind} · {analysis.grade || "—"} · {analysis.provider}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AICoach;
