"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Bell,
  ChartNoAxesCombined,
  Compass,
  Crown,
  Menu,
  Search,
  Settings2,
  Star,
  WalletCards,
  Zap
} from "lucide-react";
import WalletConnect from "./WalletConnect";

const nav = [
  { href: "/", label: "Explore", icon: Compass },
  { href: "/markets", label: "New Pairs", icon: ChartNoAxesCombined },
  { href: "/alpha", label: "Alpha", icon: Zap },
  { href: "/watchlist", label: "Watchlist", icon: Star },
  { href: "/portfolio", label: "Portfolio", icon: WalletCards },
  { href: "/activity", label: "Activity", icon: Activity }
];

export default function TerminalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="ds-shell">
      <header className="ds-header">
        <div className="ds-header-left">
          <Link href="/" className="ds-logo">
            <span className="ds-logo-mark"><span /><span /><span /></span>
            <strong>TokenSpace</strong>
          </Link>

          <div className="ds-global-search">
            <Search size={16} />
            <span>Search token, pair or address</span>
            <kbd>/</kbd>
          </div>
        </div>

        <nav className="ds-header-nav">
          <Link href="/watchlist">Watchlist</Link>
          <Link href="/activity">Alerts</Link>
          <Link href="/markets">New Pairs</Link>
          <Link href="/markets">Gainers</Link>
          <Link href="/premium" className="ds-premium-link"><Crown size={13} /> Premium</Link>
        </nav>

        <div className="ds-header-actions">
          <button className="ds-icon-btn" type="button" aria-label="Notifications"><Bell size={16} /></button>
          <button className="ds-icon-btn" type="button" aria-label="Settings"><Settings2 size={16} /></button>
          <div className="ds-chain-pill"><span className="ds-chain-dot" /> Solana</div>
          <WalletConnect />
          <button className="ds-icon-btn ds-mobile-menu" type="button" aria-label="Menu"><Menu size={17} /></button>
        </div>
      </header>

      <div className="ds-layout">
        <aside className="ds-rail">
          <div className="ds-rail-label">TOOLS</div>
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link href={href} className={active ? "ds-rail-item active" : "ds-rail-item"} key={href}>
                <Icon size={17} strokeWidth={1.9} />
                <span>{label}</span>
              </Link>
            );
          })}

          <div className="ds-rail-spacer" />

          <div className="ds-rail-status">
            <span className="ds-status-line"><i /> MAINNET</span>
            <strong>Solana</strong>
            <small>Live market data</small>
          </div>
        </aside>

        <main className="ds-main">
          <div className="ds-chain-strip">
            <span className="ds-chain-strip-title">CHAIN</span>
            <Link className="active" href="/">Solana</Link>
            <span>DEX</span>
            <b>All DEXs</b>
            <span className="ds-strip-grow" />
            <span className="ds-strip-note"><i /> Market data updates automatically</span>
          </div>
          <div className="ds-content">{children}</div>
        </main>
      </div>

      <nav className="ds-mobile-nav">
        {nav.slice(0, 5).map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return <Link href={href} className={active ? "active" : ""} key={href}><Icon size={17} /><span>{label}</span></Link>;
        })}
      </nav>
    </div>
  );
}
