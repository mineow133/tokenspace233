"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Clock3,
  Flame,
  Gauge,
  Search,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Zap
} from "lucide-react";
import TokenTable, { MarketToken } from "./TokenTable";

type Props = {
  title?: string;
  subtitle?: string;
  compact?: boolean;
};

function money(value: number) {
  if (!Number.isFinite(value)) return "—";
  if (value >= 1e9) return "$" + (value / 1e9).toFixed(2) + "B";
  if (value >= 1e6) return "$" + (value / 1e6).toFixed(2) + "M";
  if (value >= 1e3) return "$" + (value / 1e3).toFixed(1) + "K";
  return "$" + value.toFixed(0);
}

export default function MarketBoard({
  title = "Find the move before the crowd.",
  subtitle = "A faster Solana discovery surface built around momentum, liquidity and immediate execution.",
  compact = false
}: Props) {
  const [tokens, setTokens] = useState<MarketToken[]>([]);
  const [newTokens, setNewTokens] = useState<MarketToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"hot" | "new" | "gainers">("hot");
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/tokens", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Market unavailable");
      setTokens(Array.isArray(data.tokens) ? data.tokens : []);
      setNewTokens(Array.isArray(data.newTokens) ? data.newTokens : []);
      setLastUpdated(data.updatedAt || Date.now());
    } catch {
      setTokens([]);
      setNewTokens([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const interval = window.setInterval(load, 30000);
    return () => window.clearInterval(interval);
  }, []);

  const visible = useMemo(() => {
    const source = tab === "new" ? newTokens : tokens;
    let rows = [...source];

    if (tab === "new") {
      rows.sort((a, b) => Date.parse(b.createdAt || "0") - Date.parse(a.createdAt || "0"));
    } else if (tab === "gainers") {
      rows.sort((a, b) => b.change - a.change);
    } else {
      rows.sort((a, b) => b.score - a.score);
    }

    const needle = query.trim().toLowerCase();
    return needle
      ? rows.filter((t) => (t.symbol + " " + t.name + " " + t.address).toLowerCase().includes(needle))
      : rows;
  }, [tokens, newTokens, query, tab]);

  const topVolume = tokens.length ? [...tokens].sort((a, b) => b.volume - a.volume)[0] : null;
  const freshest = newTokens.length ? newTokens[0] : null;
  const averageChange = tokens.length
    ? tokens.reduce((sum, token) => sum + token.change, 0) / tokens.length
    : 0;

  const lanes = [
    { key: "hot", label: "Hot now", icon: Flame, color: "purple", rows: tokens.slice(0, 3) },
    { key: "new", label: "Fresh pairs", icon: Sparkles, color: "blue", rows: newTokens.slice(0, 3) },
    { key: "gainers", label: "Fast gainers", icon: TrendingUp, color: "green", rows: [...tokens].sort((a, b) => b.change - a.change).slice(0, 3) }
  ] as const;

  return (
    <div className="discover-page">
      <section className="hero-panel">
        <div className="hero-orb orb-a" />
        <div className="hero-orb orb-b" />
        <div className="hero-grid" />
        <div className="hero-content">
          <div className="hero-eyebrow"><span className="live-dot" /> SOLANA MARKET INTELLIGENCE</div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
          <div className="hero-actions">
            <button className="primary-button" type="button" onClick={load}>
              <Zap size={16} /> Refresh market
            </button>
            <div className="hero-status"><Activity size={15} /> {lastUpdated ? "Updated just now" : "Connecting to market data"}</div>
          </div>
        </div>
        <div className="hero-metric">
          <span>TRACKED</span>
          <strong>{loading ? "—" : tokens.length}</strong>
          <small>live token signals</small>
        </div>
      </section>

      <section className="stat-row">
        <div className="stat-card">
          <div className="stat-icon purple"><Gauge size={18} /></div>
          <div><span>MARKET HEAT</span><strong>{loading ? "—" : Math.round(tokens.reduce((a, b) => a + b.score, 0) / Math.max(tokens.length, 1))}</strong></div>
          <em>avg signal</em>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><Sparkles size={18} /></div>
          <div><span>FRESHEST</span><strong>{freshest ? freshest.symbol : "—"}</strong></div>
          <em>{freshest ? money(freshest.marketCap) : "new pair"}</em>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><TrendingUp size={18} /></div>
          <div><span>AVG 24H</span><strong>{averageChange >= 0 ? "+" : ""}{averageChange.toFixed(1)}%</strong></div>
          <em>across tracked</em>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><Zap size={18} /></div>
          <div><span>TOP VOLUME</span><strong>{topVolume ? topVolume.symbol : "—"}</strong></div>
          <em>{topVolume ? money(topVolume.volume) : "24h volume"}</em>
        </div>
      </section>

      <section className="signal-lanes">
        {lanes.map(({ key, label, icon: Icon, color, rows }) => (
          <button key={key} type="button" className={"lane-card " + color} onClick={() => setTab(key as "hot" | "new" | "gainers")}>
            <div className="lane-head">
              <span><Icon size={15} /> {label}</span>
              <span className="lane-arrow">↗</span>
            </div>
            {rows.length ? rows.map((token) => (
              <span className="lane-row" key={token.address || token.symbol}>
                <span>{token.symbol}</span>
                <strong className={token.change >= 0 ? "up" : "down"}>{token.change >= 0 ? "+" : ""}{token.change.toFixed(1)}%</strong>
              </span>
            )) : <span className="lane-empty">Waiting for live pairs…</span>}
          </button>
        ))}
      </section>

      <div className={compact ? "board-layout compact" : "board-layout"}>
        <div>
          <section className="board-head">
            <div>
              <span className="section-kicker">DISCOVER</span>
              <h2>Token radar</h2>
            </div>
            <div className="board-tools">
              <div className="search-box">
                <Search size={16} />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search ticker, name, address" />
                <kbd>/</kbd>
              </div>
              <button className="filter-button" type="button"><SlidersHorizontal size={15} /> Filters</button>
            </div>
          </section>

          <div className="mode-tabs">
            <button className={tab === "hot" ? "active" : ""} onClick={() => setTab("hot")}><Flame size={15} /> Hot</button>
            <button className={tab === "new" ? "active" : ""} onClick={() => setTab("new")}><Sparkles size={15} /> New</button>
            <button className={tab === "gainers" ? "active" : ""} onClick={() => setTab("gainers")}><TrendingUp size={15} /> Gainers</button>
          </div>

          <TokenTable tokens={visible} loading={loading} emptyLabel="No Solana tokens match this search." />
        </div>

        <aside className="pulse-column">
          <div className="side-widget">
            <div className="side-widget-head">
              <div><span className="section-kicker">LIVE PULSE</span><h3>Flow right now</h3></div>
              <Clock3 size={17} />
            </div>
            <div className="pulse-list">
              {tokens.slice(0, 9).map((token, index) => (
                <a href={token.address ? "/token/" + token.address : "/"} className="pulse-row" key={token.address || token.symbol + index}>
                  <span className="pulse-rank">{String(index + 1).padStart(2, "0")}</span>
                  <span className="pulse-token"><b>{token.symbol}</b><small>{money(token.volume)} vol</small></span>
                  <span className={token.change >= 0 ? "up" : "down"}>{token.change >= 0 ? "+" : ""}{token.change.toFixed(1)}%</span>
                </a>
              ))}
              {!loading && tokens.length === 0 && <div className="side-empty">No market signal available.</div>}
            </div>
          </div>

          <div className="side-widget accent-widget">
            <div className="widget-glow" />
            <div className="side-widget-head">
              <div><span className="section-kicker">EXECUTION</span><h3>One screen. Zero context switching.</h3></div>
              <Zap size={17} />
            </div>
            <p>Open a token, inspect the chart, then swap through Jupiter without leaving TokenSpace.</p>
            <div className="execution-pills"><span>Phantom</span><span>Solflare</span><span>Jupiter</span></div>
          </div>
        </aside>
      </div>
    </div>
  );
}
