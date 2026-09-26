"use client";

import Link from "next/link";
import { ArrowUpRight, ExternalLink } from "lucide-react";
import WatchlistButton from "./WatchlistButton";

export type MarketToken = {
  address: string;
  symbol: string;
  name: string;
  image: string;
  marketCap: number;
  liquidity: number;
  volume: number;
  change: number;
  score: number;
  txns?: number;
  buys?: number;
  sells?: number;
  createdAt?: string;
  pairUrl?: string;
  price?: number;
};

function money(value: number) {
  if (!Number.isFinite(value)) return "—";
  if (value >= 1e9) return "$" + (value / 1e9).toFixed(2) + "B";
  if (value >= 1e6) return "$" + (value / 1e6).toFixed(2) + "M";
  if (value >= 1e3) return "$" + (value / 1e3).toFixed(1) + "K";
  return "$" + value.toFixed(0);
}

function price(value: number) {
  if (!value) return "—";
  if (value >= 1) return "$" + value.toFixed(2);
  if (value >= 0.01) return "$" + value.toFixed(4);
  if (value >= 0.0001) return "$" + value.toFixed(6);
  return "$" + value.toFixed(9);
}

function TokenAvatar({ token }: { token: MarketToken }) {
  return token.image ? (
    <img className="market-avatar" src={token.image} alt="" />
  ) : (
    <span className="market-avatar fallback">{token.symbol.slice(0, 1)}</span>
  );
}

export default function TokenTable({
  tokens,
  loading = false,
  emptyLabel = "No matching tokens."
}: {
  tokens: MarketToken[];
  loading?: boolean;
  emptyLabel?: string;
}) {
  return (
    <section className="data-card market-table-card">
      <div className="data-card-head">
        <div>
          <span className="section-kicker">LIVE MARKET</span>
          <h2>Token radar</h2>
        </div>
        <div className="table-source">
          <span className="live-dot" />
          Live
        </div>
      </div>

      <div className="table-header market-grid">
        <span>TOKEN</span>
        <span>PRICE</span>
        <span>MARKET CAP</span>
        <span>LIQUIDITY</span>
        <span>24H VOLUME</span>
        <span>24H</span>
        <span>HEAT</span>
        <span />
      </div>

      {loading ? (
        <div className="table-loading">
          {Array.from({ length: 7 }).map((_, i) => (
            <div className="table-skeleton market-grid" key={i}>
              <span /><span /><span /><span /><span /><span /><span /><span />
            </div>
          ))}
        </div>
      ) : tokens.length === 0 ? (
        <div className="table-empty">{emptyLabel}</div>
      ) : (
        tokens.map((token, index) => (
          <div className="market-row market-grid" key={token.address || token.symbol + index}>
            <Link href={token.address ? "/token/" + token.address : "/"} className="market-token-cell">
              <TokenAvatar token={token} />
              <span className="token-copy">
                <strong>{token.symbol}</strong>
                <small>{token.name}</small>
              </span>
              {index < 3 && <span className="tiny-tag">{index === 0 ? "HOT" : "FLOW"}</span>}
            </Link>

            <Link href={token.address ? "/token/" + token.address : "/"} className="metric-link">
              <strong>{price(token.price ?? 0)}</strong>
            </Link>
            <Link href={token.address ? "/token/" + token.address : "/"} className="metric-link muted">
              {money(token.marketCap)}
            </Link>
            <Link href={token.address ? "/token/" + token.address : "/"} className="metric-link muted">
              {money(token.liquidity)}
            </Link>
            <Link href={token.address ? "/token/" + token.address : "/"} className="metric-link muted">
              {money(token.volume)}
            </Link>
            <Link
              href={token.address ? "/token/" + token.address : "/"}
              className={token.change >= 0 ? "metric-link change up" : "metric-link change down"}
            >
              {token.change >= 0 ? "+" : ""}{token.change.toFixed(1)}%
            </Link>
            <Link href={token.address ? "/token/" + token.address : "/"} className="metric-link heat-cell">
              <span className="heat-pill">{token.score}</span>
            </Link>
            <span className="row-actions">
              <WatchlistButton address={token.address} />
              {token.pairUrl ? (
                <a href={token.pairUrl} target="_blank" rel="noreferrer" className="row-link" aria-label="Open DEX Screener">
                  <ExternalLink size={14} />
                </a>
              ) : (
                <ArrowUpRight size={14} className="muted-icon" />
              )}
            </span>
          </div>
        ))
      )}
    </section>
  );
}
