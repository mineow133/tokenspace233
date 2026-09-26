"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, History, Radio } from "lucide-react";

type Trade = { token: string; symbol: string; side: "BUY" | "SELL"; amount: string; signature: string; timestamp: number };

function readTrades() {
  try {
    const data = localStorage.getItem("tokenspace:activity:v1");
    const rows = data ? JSON.parse(data) : [];
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

export default function ActivityView() {
  const [rows, setRows] = useState<Trade[]>([]);

  useEffect(() => {
    setRows(readTrades());
    const handler = () => setRows(readTrades());
    window.addEventListener("tokenspace-activity", handler);
    return () => window.removeEventListener("tokenspace-activity", handler);
  }, []);

  return (
    <div className="activity-page">
      <section className="page-title-row">
        <div><span className="section-kicker">ACTIVITY</span><h1>Your execution trail.</h1><p>Trades made through TokenSpace on this browser.</p></div>
        <div className="activity-live-badge"><Radio size={14} /> On-chain</div>
      </section>

      <section className="data-card activity-data">
        <div className="data-card-head"><div><span className="section-kicker">TRADE LOG</span><h2>Recent swaps</h2></div><History size={18} /></div>
        {rows.length === 0 ? (
          <div className="empty-page compact-empty">
            <div className="empty-icon"><History size={23} /></div>
            <h3>No swaps logged yet.</h3>
            <p>Your confirmed Jupiter swaps will appear here after execution.</p>
          </div>
        ) : (
          <div className="activity-list">
            {rows.map((row) => (
              <div className="activity-row" key={row.signature}>
                <span className={row.side === "BUY" ? "activity-side buy" : "activity-side sell"}>{row.side}</span>
                <Link href={"/token/" + row.token} className="activity-token"><strong>{row.symbol}</strong><small>{new Date(row.timestamp).toLocaleString()}</small></Link>
                <span className="activity-amount">{row.amount}</span>
                <a className="activity-tx" href={"https://solscan.io/tx/" + row.signature} target="_blank" rel="noreferrer">View tx <ArrowUpRight size={14} /></a>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
