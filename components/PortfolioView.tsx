"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CircleDollarSign, Copy, WalletCards } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import WalletConnect from "./WalletConnect";

type Asset = {
  mint: string;
  amount: string;
  decimals: number;
  uiAmount: number;
  symbol: string;
  name: string;
  image: string;
  priceUsd: number;
  valueUsd: number;
};

type Summary = { wallet: string; sol: { amount: number }; assets: Asset[] };

function money(value: number) {
  if (!value) return "$0.00";
  if (value >= 1e9) return "$" + (value / 1e9).toFixed(2) + "B";
  if (value >= 1e6) return "$" + (value / 1e6).toFixed(2) + "M";
  if (value >= 1e3) return "$" + (value / 1e3).toFixed(1) + "K";
  return "$" + value.toFixed(2);
}

export default function PortfolioView() {
  const { publicKey } = useWallet();
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    if (!publicKey) return;
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/wallet/summary?owner=" + publicKey.toBase58(), { cache: "no-store" });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || "Portfolio unavailable");
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Portfolio unavailable");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [publicKey]);

  if (!publicKey) {
    return (
      <div className="empty-page hero-empty">
        <div className="empty-icon"><WalletCards size={24} /></div>
        <span className="section-kicker">YOUR PORTFOLIO</span>
        <h1>Connect a wallet to see your assets.</h1>
        <p>TokenSpace reads balances directly from Solana. Nothing is stored by the app.</p>
        <WalletConnect />
      </div>
    );
  }

  const priced = data?.assets.reduce((sum, asset) => sum + asset.valueUsd, 0) || 0;

  return (
    <div className="portfolio-page">
      <section className="page-title-row">
        <div><span className="section-kicker">PORTFOLIO</span><h1>Your on-chain balance.</h1><p>Live balances from Solana mainnet.</p></div>
        <button className="secondary-button" type="button" onClick={load}>Refresh</button>
      </section>

      {error && <div className="inline-error">{error}</div>}

      <section className="portfolio-overview">
        <div className="portfolio-value-card">
          <span>PRICED TOKEN VALUE</span>
          <strong>{loading ? "Loading…" : money(priced)}</strong>
          <small>Excludes SOL from USD total</small>
        </div>
        <div className="portfolio-mini">
          <span>SOL BALANCE</span>
          <strong>{loading ? "—" : (data?.sol.amount ?? 0).toFixed(3)} SOL</strong>
        </div>
        <div className="portfolio-mini">
          <span>ASSETS</span>
          <strong>{loading ? "—" : data?.assets.length ?? 0}</strong>
        </div>
      </section>

      <section className="data-card">
        <div className="data-card-head"><div><span className="section-kicker">ASSET INVENTORY</span><h2>Held tokens</h2></div><span className="wallet-address"><Copy size={12} />{publicKey.toBase58().slice(0, 7)}…{publicKey.toBase58().slice(-6)}</span></div>
        {loading ? <div className="table-empty">Reading wallet balances…</div> : data?.assets.length ? (
          <div className="asset-list">
            {data.assets.map((asset) => (
              <Link className="asset-row" href={"/token/" + asset.mint} key={asset.mint}>
                <span className="asset-token">{asset.image ? <img src={asset.image} alt="" /> : <span>{asset.symbol.slice(0,1)}</span>}</span>
                <span className="asset-copy"><strong>{asset.symbol}</strong><small>{asset.name}</small></span>
                <span className="asset-amount">{asset.uiAmount.toLocaleString(undefined, { maximumFractionDigits: 6 })}</span>
                <span className="asset-price">{asset.priceUsd ? "$" + asset.priceUsd.toFixed(6) : "Unpriced"}</span>
                <strong className="asset-value">{asset.valueUsd ? money(asset.valueUsd) : "—"}</strong>
              </Link>
            ))}
          </div>
        ) : <div className="table-empty">No non-zero SPL token balances found.</div>}
      </section>
    </div>
  );
}
