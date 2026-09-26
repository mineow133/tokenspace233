"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowUpRight, Clock3, Flame, Gauge, Search, SlidersHorizontal, Sparkles, TrendingUp, Zap } from "lucide-react";
import TokenTable, { MarketToken } from "./TokenTable";

type Props = { title?: string; subtitle?: string; compact?: boolean };

function money(value: number) {
  if (!Number.isFinite(value)) return "—";
  if (value >= 1e9) return "$" + (value / 1e9).toFixed(2) + "B";
  if (value >= 1e6) return "$" + (value / 1e6).toFixed(2) + "M";
  if (value >= 1e3) return "$" + (value / 1e3).toFixed(1) + "K";
  return "$" + value.toFixed(0);
}

function pct(value: number) {
  return (value >= 0 ? "+" : "") + value.toFixed(1) + "%";
}

export default function MarketBoard({
  title = "Find the move before the crowd.",
  subtitle = "A faster Solana discovery surface built around momentum, liquidity and immediate execution.",
  compact = false
}: Props) {
  const [tokens, setTokens] = useState<MarketToken[]>([]);
  const [newTokens, setNewTokens] = useState<MarketToken[]>([]);
  const [firstLoad, setFirstLoad] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"hot" | "new" | "gainers">("hot");
  const [filter, setFilter] = useState<"all" | "small" | "flow" | "fresh">("all");
  const [visibleCount, setVisibleCount] = useState(60);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);

  async function load() {
    if (firstLoad) setFirstLoad(true);
    else setRefreshing(true);

    try {
      const response = await fetch("/api/tokens?t=" + Date.now(), { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Market unavailable");

      setTokens(Array.isArray(data.tokens) ? data.tokens : []);
      setNewTokens(Array.isArray(data.newTokens) ? data.newTokens : []);
      setLastUpdated(data.updatedAt || Date.now());
      setSecondsAgo(0);
    } catch {
      // Preserve the last good live snapshot.
    } finally {
      setFirstLoad(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
    const id = window.setInterval(load, 15000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => setVisibleCount(60), [tab, filter, query]);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (lastUpdated) setSecondsAgo(Math.floor((Date.now() - lastUpdated) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [lastUpdated]);

  const visible = useMemo(() => {
    let rows = [...(tab === "new" ? newTokens : tokens)];

    if (filter === "small") rows = rows.filter((t) => t.marketCap > 0 && t.marketCap < 1_000_000);
    if (filter === "flow") rows = rows.filter((t) => t.marketCap > 0 && t.volume / t.marketCap >= 0.12);
    if (filter === "fresh") {
      rows = rows.filter((t) => {
        const d = Date.parse(t.createdAt || "");
        return d > 0 && Date.now() - d < 86_400_000;
      });
    }

    if (tab === "new") rows.sort((a, b) => Date.parse(b.createdAt || "0") - Date.parse(a.createdAt || "0"));
    else if (tab === "gainers") rows.sort((a, b) => b.change - a.change);
    else rows.sort((a, b) => b.score - a.score);

    const needle = query.trim().toLowerCase();
    if (needle) rows = rows.filter((t) => (t.symbol + " " + t.name + " " + t.address).toLowerCase().includes(needle));

    return rows;
  }, [tokens, newTokens, query, tab, filter]);

  const topVolume = tokens.length ? [...tokens].sort((a, b) => b.volume - a.volume)[0] : null;
  const freshest = newTokens.length ? newTokens[0] : null;
  const avg = tokens.length ? tokens.reduce((s, t) => s + t.change, 0) / tokens.length : 0;
  const combined = tokens.reduce((s, t) => s + t.volume, 0);
  const heat = tokens.length ? Math.round(tokens.reduce((s, t) => s + t.score, 0) / tokens.length) : 0;
  const greenCount = tokens.filter((t) => t.change > 0).length;
  const redCount = tokens.filter((t) => t.change < 0).length;

  const lanes = [
    { key: "hot", label: "Hot now", icon: Flame, color: "purple", rows: tokens.slice(0, 3) },
    { key: "new", label: "Fresh pairs", icon: Sparkles, color: "blue", rows: newTokens.slice(0, 3) },
    { key: "gainers", label: "Fast gainers", icon: TrendingUp, color: "green", rows: [...tokens].sort((a, b) => b.change - a.change).slice(0, 3) }
  ] as const;

  return (
    <div className="discover-page">
      <section className="terminal-hero">
        <div className="terminal-hero-glow glow-purple" />
        <div className="terminal-hero-glow glow-blue" />
        <div className="terminal-hero-grid" />

        <div className="terminal-hero-main">
          <div className="hero-eyebrow"><span className="live-dot" /> SOLANA MARKET INTELLIGENCE</div>
          <div className="terminal-title-row">
            <div>
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>
            <div className="terminal-heat">
              <span>MARKET HEAT</span>
              <strong>{firstLoad ? "—" : heat}</strong>
              <small>{greenCount} green · {redCount} red</small>
            </div>
          </div>

          <div className="terminal-hero-footer">
            <div className="hero-actions">
              <button className="primary-button" onClick={load} disabled={refreshing}>
                <Zap size={16} /> {refreshing ? "Updating…" : "Refresh market"}
              </button>
              <div className="hero-status"><Activity size={15} /> {lastUpdated ? "Live · " + secondsAgo + "s ago" : "Connecting to market data"}</div>
            </div>
            <div className="hero-data-tags">
              <span>DEX Screener</span>
              <span>Jupiter</span>
              <span>GeckoTerminal</span>
            </div>
          </div>
        </div>
      </section>

      <section className="terminal-stat-grid">
        <div className="terminal-stat stat-purple">
          <span>TRACKED</span>
          <strong>{firstLoad ? "—" : tokens.length}</strong>
          <small>live Solana tokens</small>
        </div>
        <div className="terminal-stat stat-blue">
          <span>24H FLOW</span>
          <strong>{combined ? money(combined) : "—"}</strong>
          <small>combined volume</small>
        </div>
        <div className="terminal-stat stat-green">
          <span>AVG MOVE</span>
          <strong className={avg >= 0 ? "up" : "down"}>{pct(avg)}</strong>
          <small>tracked basket</small>
        </div>
        <div className="terminal-stat stat-orange">
          <span>FRESHEST</span>
          <strong>{freshest ? freshest.symbol : "—"}</strong>
          <small>{freshest ? money(freshest.marketCap) + " MC" : "new pair"}</small>
        </div>
        <div className="terminal-stat stat-red">
          <span>TOP VOLUME</span>
          <strong>{topVolume ? topVolume.symbol : "—"}</strong>
          <small>{topVolume ? money(topVolume.volume) : "24h volume"}</small>
        </div>
      </section>

      <section className="market-spotlights">
        {lanes.map(({ key, label, icon: Icon, color, rows }) => (
          <button key={key} className={"spotlight-card " + color} onClick={() => setTab(key as "hot" | "new" | "gainers")}>
            <div className="spotlight-head">
              <span><Icon size={16} /> {label}</span>
              <ArrowUpRight size={17} />
            </div>
            {rows.length ? rows.map((t, index) => (
              <span className="spotlight-row" key={t.address || t.symbol + index}>
                <span><b>{t.symbol}</b><small>{money(t.marketCap)} MC · {money(t.volume)} vol</small></span>
                <strong className={t.change >= 0 ? "up" : "down"}>{pct(t.change)}</strong>
              </span>
            )) : (
              <span className="spotlight-empty">Waiting for live pairs…</span>
            )}
          </button>
        ))}
      </section>

      <div className={compact ? "board-layout compact" : "board-layout"}>
        <div>
          <section className="board-head">
            <div>
              <span className="section-kicker">MARKET SCANNER</span>
              <h2>Live token radar</h2>
              <p className="board-subtitle">{visible.length} matching signals · market cap refreshes every 15 seconds</p>
            </div>

            <div className="board-tools">
              <div className="search-box">
                <Search size={17} />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search ticker, name, address" />
                <kbd>/</kbd>
              </div>
              <button className="filter-button"><SlidersHorizontal size={15} /> Filters</button>
            </div>
          </section>

          <div className="market-toolbar">
            <div className="mode-tabs">
              <button className={tab === "hot" ? "active" : ""} onClick={() => setTab("hot")}><Flame size={15} />Hot</button>
              <button className={tab === "new" ? "active" : ""} onClick={() => setTab("new")}><Sparkles size={15} />New</button>
              <button className={tab === "gainers" ? "active" : ""} onClick={() => setTab("gainers")}><TrendingUp size={15} />Gainers</button>
            </div>

            <div className="quick-filters">
              <span>FILTER</span>
              {(["all", "small", "flow", "fresh"] as const).map((key) => (
                <button key={key} className={filter === key ? "active" : ""} onClick={() => setFilter(key)}>
                  {key === "all" ? "All" : key === "small" ? "MC < $1M" : key === "flow" ? "High flow" : "Fresh < 24h"}
                </button>
              ))}
            </div>
          </div>

          <TokenTable tokens={visible.slice(0, visibleCount)} loading={firstLoad} emptyLabel="No Solana tokens match these filters." />
          {visible.length > visibleCount && (
            <button className="load-more" onClick={() => setVisibleCount((v) => Math.min(v + 60, visible.length))}>
              Load 60 more · {visible.length - visibleCount} left
            </button>
          )}
        </div>

        <aside className="pulse-column">
          <div className="side-widget live-widget">
            <div className="side-widget-head">
              <div>
                <span className="section-kicker">LIVE PULSE</span>
                <h3>Flow right now</h3>
              </div>
              <Clock3 size={17} />
            </div>

            <div className="pulse-summary">
              <span><b>{tokens.length}</b> tracked</span>
              <span><b>{greenCount}</b> advancing</span>
            </div>

            <div className="pulse-list">
              {tokens.slice(0, 10).map((t, i) => (
                <a href={t.address ? "/token/" + t.address : "/"} className="pulse-row" key={t.address}>
                  <span className="pulse-rank">{String(i + 1).padStart(2, "0")}</span>
                  <span className="pulse-token"><b>{t.symbol}</b><small>MC {money(t.marketCap)} · Vol {money(t.volume)}</small></span>
                  <span className={t.change >= 0 ? "up" : "down"}>{pct(t.change)}</span>
                </a>
              ))}
            </div>
          </div>

          <div className="side-widget execution-widget">
            <div className="widget-color-line" />
            <div className="side-widget-head">
              <div>
                <span className="section-kicker">EXECUTION</span>
                <h3>Discover → inspect → trade</h3>
              </div>
              <Zap size={17} />
            </div>
            <p>Open a token to view the live chart, liquidity and market data, then execute through Jupiter using Phantom or Solflare.</p>
            <div className="execution-pills"><span>Phantom</span><span>Solflare</span><span>Jupiter</span></div>
          </div>
        </aside>
      </div>
    </div>
  );
}
