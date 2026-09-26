"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  Bell,
  Compass,
  Crown,
  Settings2,
  Sparkles,
  Star,
  WalletCards,
  Zap
} from "lucide-react";
import WalletConnect from "./WalletConnect";

const nav = [
  { href: "/", label: "Discover", icon: Compass },
  { href: "/markets", label: "Markets", icon: BarChart3 },
  { href: "/alpha", label: "Alpha Radar", icon: Sparkles },
  { href: "/watchlist", label: "Watchlist", icon: Star },
  { href: "/portfolio", label: "Portfolio", icon: WalletCards },
  { href: "/activity", label: "Activity", icon: Activity }
];

export default function TerminalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="ts-app">
      <aside className="ts-sidebar">
        <Link href="/" className="ts-brand">
          <span className="ts-brand-orb">
            <span />
            <span />
            <span />
          </span>
          <span>
            <strong>TokenSpace</strong>
            <small>SOLANA TRADING TERMINAL</small>
          </span>
        </Link>

        <div className="ts-nav-group">
          <div className="ts-nav-caption">WORKSPACE</div>
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link href={href} className={active ? "ts-nav-link active" : "ts-nav-link"} key={href}>
                <Icon size={17} strokeWidth={1.9} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>

        <div className="ts-nav-group ts-edge-group">
          <div className="ts-nav-caption">EDGE</div>
          <Link
            href="/premium"
            className={pathname.startsWith("/premium") ? "ts-nav-link premium-link active" : "ts-nav-link premium-link"}
          >
            <Crown size={17} strokeWidth={1.9} />
            <span>Premium Alpha</span>
          </Link>
        </div>

        <div className="ts-side-card">
          <div className="ts-side-card-head">
            <span className="live-dot" />
            <span>MAINNET LIVE</span>
          </div>
          <strong>Solana / Jupiter</strong>
          <p>Market discovery refreshes every 15s. Trades route through Jupiter and settle on-chain.</p>
          <div className="ts-side-mini">
            <span><Zap size={13} /> Jupiter</span>
            <span><Sparkles size={13} /> DEX data</span>
          </div>
        </div>
      </aside>

      <div className="ts-main">
        <header className="ts-topbar">
          <div className="ts-top-left">
            <Link href="/" className="ts-mobile-brand">TokenSpace</Link>
            <div className="ts-breadcrumb-wrap">
              <span className="ts-breadcrumb">SOLANA / TERMINAL</span>
              <span className="ts-top-status"><span className="live-dot" /> LIVE</span>
            </div>
          </div>

          <div className="ts-top-actions">
            <div className="ts-network-pill"><span className="ts-network-dot" /> Solana Mainnet</div>
            <button className="icon-button" type="button" aria-label="Notifications"><Bell size={17} /></button>
            <button className="icon-button" type="button" aria-label="Settings"><Settings2 size={17} /></button>
            <WalletConnect />
          </div>
        </header>

        <div className="ts-content">
          {children}
        </div>
      </div>

      <nav className="ts-mobile-nav">
        {nav.slice(0, 4).map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link href={href} className={active ? "active" : ""} key={href}>
              <Icon size={18} />
              <span>{label === "Alpha Radar" ? "Alpha" : label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
