import React, { useEffect, useState } from "react";
import { api, formatINR } from "../lib/api";

const SubscribeForm = ({ ipo, onDone }) => {
  const [lots, setLots] = useState(ipo.minLots || 1);
  const [bidPrice, setBidPrice] = useState(ipo.priceBand.upper);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api(`/ipo/${ipo._id}/subscribe`, {
        method: "POST",
        body: { lots: Number(lots), bidPrice: Number(bidPrice), category: "RETAIL" },
      });
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const block = lots * ipo.lotSize * bidPrice;
  return (
    <form onSubmit={submit} style={{ display: "flex", gap: 6, alignItems: "center" }}>
      <label>Lots
        <input type="number" min={ipo.minLots} max={ipo.maxLotsRetail} value={lots} onChange={(e) => setLots(e.target.value)} />
      </label>
      <label>Bid
        <input type="number" min={ipo.priceBand.lower} max={ipo.priceBand.upper} step="0.5" value={bidPrice} onChange={(e) => setBidPrice(e.target.value)} />
      </label>
      <span>Block: <b>{formatINR(block)}</b></span>
      <button type="submit" disabled={busy}>{busy ? "..." : "Apply"}</button>
      {error && <span style={{ color: "crimson" }}>{error}</span>}
    </form>
  );
};

const IPO = () => {
  const [ipos, setIpos] = useState([]);
  const [subs, setSubs] = useState([]);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const [a, b] = await Promise.all([api("/ipo"), api("/ipo/my")]);
      setIpos(a.ipos || []);
      setSubs(b.subscriptions || []);
    } catch (err) {
      setError(err.message);
    }
  };
  useEffect(() => { load(); }, []);

  return (
    <div>
      <h2>IPOs</h2>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <h3>Open / Upcoming</h3>
      <table>
        <thead>
          <tr>
            <th>Symbol</th><th>Company</th><th>Exch</th><th>Band</th><th>Lot</th><th>Window</th><th>Status</th><th>Apply</th>
          </tr>
        </thead>
        <tbody>
          {ipos.filter((i) => ["UPCOMING", "OPEN"].includes(i.status)).map((i) => (
            <tr key={i._id}>
              <td>{i.symbol}</td>
              <td>{i.companyName}</td>
              <td>{i.exchange}</td>
              <td>{formatINR(i.priceBand.lower)} – {formatINR(i.priceBand.upper)}</td>
              <td>{i.lotSize}</td>
              <td>{new Date(i.openDate).toLocaleDateString()} – {new Date(i.closeDate).toLocaleDateString()}</td>
              <td>{i.status}</td>
              <td><SubscribeForm ipo={i} onDone={load} /></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>My Subscriptions</h3>
      <table>
        <thead>
          <tr><th>Symbol</th><th>Lots</th><th>Qty</th><th>Bid</th><th>Blocked</th><th>Status</th><th>Allotted</th></tr>
        </thead>
        <tbody>
          {subs.map((s) => (
            <tr key={s._id}>
              <td>{s.ipoId && s.ipoId.symbol}</td>
              <td>{s.lots}</td>
              <td>{s.quantity}</td>
              <td>{formatINR(s.bidPrice)}</td>
              <td>{formatINR(s.blockedAmount)}</td>
              <td>{s.status}</td>
              <td>{s.allottedQuantity ? `${s.allottedQuantity} (${formatINR(s.allottedAmount)})` : "-"}</td>
            </tr>
          ))}
          {subs.length === 0 && (
            <tr><td colSpan={7} style={{ textAlign: "center", padding: 12, color: "#888" }}>No subscriptions yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default IPO;
