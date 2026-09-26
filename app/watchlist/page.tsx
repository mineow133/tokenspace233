"use client";

import { useEffect, useState } from "react";
import TerminalShell from "../../components/TerminalShell";
import TokenTable, { MarketToken } from "../../components/TokenTable";

const KEY = "tokenspace:watchlist:v2";

function readWatchlist() {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export default function WatchlistPage() {
  const [tokens, setTokens] = useState<MarketToken[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const addresses = readWatchlist();
    if (!addresses.length) {
      setTokens([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const result: MarketToken[] = [];
    for (const address of addresses.slice(0, 100)) {
      try {
        const r = await fetch("/api/tokens/" + address, { cache: "no-store" });
        const json = await r.json();
        if (r.ok && json.token) result.push(json.token);
      } catch {}
    }
    setTokens(result);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener("tokenspace-watchlist-change", handler);
    return () => window.removeEventListener("tokenspace-watchlist-change", handler);
  }, []);

  return (
    <TerminalShell>
      <div className="utility-page">
        <section className="page-title-row">
          <div>
            <span className="section-kicker">WATCHLIST</span>
            <h1>Keep the names that matter.</h1>
            <p>Your watchlist stays in this browser and works without an account.</p>
          </div>
          <div className="count-badge">{tokens.length} saved</div>
        </section>

        <TokenTable
          tokens={tokens}
          loading={loading}
          emptyLabel="Your watchlist is empty. Star any token in Discover to pin it here."
        />
      </div>
    </TerminalShell>
  );
}
