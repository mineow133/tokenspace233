"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  Bell,
  Compass,
  LayoutGrid,
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
            <small>ONCHAIN TERMINAL</small>
          </span>
        </Link>

        <div className="ts-nav-group">
          <div className="ts-nav-caption">WORKSPACE</div>
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link href={href} className={active ? "ts-nav-link active" : "ts-nav-link"} key={href}>
                <Icon size={17} strokeWidth={1.8} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>

        <div className="ts-side-card">
          <div className="ts-side-card-head">
            <span className="live-dot" />
            <span>MARKET LIVE</span>
          </div>
          <strong>Solana Mainnet</strong>
          <p>Signals refresh every 30 seconds.</p>
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
            <span className="ts-breadcrumb">SOLANA / TERMINAL</span>
          </div>
          <div className="ts-top-actions">
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
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
