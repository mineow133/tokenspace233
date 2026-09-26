import Link from "next/link";
import { ArrowLeft, ExternalLink, Globe, ShieldCheck, Users } from "lucide-react";
import TerminalShell from "../../../components/TerminalShell";
import WalletConnect from "../../../components/WalletConnect";
import WatchlistButton from "../../../components/WatchlistButton";
import CopyButton from "../../../components/CopyButton";
import JupiterTrade from "../../../components/JupiterTrade";
import { normalize, scorePair, type DexPair } from "../../../lib/ranking";

function money(value: number) {
  if (!Number.isFinite(value)) return "—";
  if (value >= 1e9) return "$" + (value / 1e9).toFixed(2) + "B";
  if (value >= 1e6) return "$" + (value / 1e6).toFixed(2) + "M";
  if (value >= 1e3) return "$" + (value / 1e3).toFixed(1) + "K";
  return "$" + value.toFixed(2);
}

function price(value: number) {
  if (!value) return "—";
  if (value >= 1) return "$" + value.toFixed(2);
  if (value >= 0.01) return "$" + value.toFixed(4);
  if (value >= 0.0001) return "$" + value.toFixed(6);
  return "$" + value.toFixed(9);
}

async function getPair(address: string) {
  try {
    const response = await fetch("https://api.dexscreener.com/tokens/v1/solana/" + address, {
      headers: { accept: "application/json" },
      next: { revalidate: 15 }
    });
    if (!response.ok) return null;
    const pairs: DexPair[] = await response.json();
    return pairs
      .filter((pair) => pair.baseToken?.address === address && pair.chainId === "solana")
      .sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))[0] || null;
  } catch {
    return null;
  }
}

function since(timestamp?: number) {
  if (!timestamp) return "Unknown age";
  const days = Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000));
  if (days === 0) return "Created today";
  if (days === 1) return "1 day old";
  return days + " days old";
}

export default async function TokenPage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  const pair = await getPair(address);

  if (!pair) {
    return (
      <TerminalShell>
        <div className="empty-page hero-empty">
          <div className="empty-icon"><ArrowLeft size={23} /></div>
          <span className="section-kicker">TOKENSPACE</span>
          <h1>Token not available.</h1>
          <p>The market data source is not currently returning a Solana pair for this address.</p>
          <Link className="secondary-button inline-button" href="/">Back to Discover</Link>
        </div>
      </TerminalShell>
    );
  }

  const token = normalize(pair);
  const heat = scorePair(pair);
  const websites = pair.info?.websites || [];
  const socials = pair.info?.socials || [];
  const xLink = socials.find((item) => item.type === "twitter")?.url || socials.find((item) => item.type === "x")?.url;
  const website = websites[0]?.url;
  const chart =
    "https://dexscreener.com/solana/" +
    pair.pairAddress +
    "?embed=1&theme=dark&trades=0&info=0&chartLeftToolbar=0&chartStyle=1&interval=15";

  return (
    <TerminalShell>
      <div className="token-workspace">
        <div className="token-crumb">
          <Link href="/"><ArrowLeft size={15} /> Discover</Link>
          <span>/</span>
          <span>{token.symbol}</span>
        </div>

        <section className="token-pro-head">
          <div className="token-pro-identity">
            {token.image ? <img className="token-pro-avatar" src={token.image} alt="" /> : <span className="token-pro-avatar fallback">{token.symbol.slice(0, 1)}</span>}
            <div>
              <div className="token-name-line">
                <h1>{token.symbol}</h1>
                <span>{token.name}</span>
                <WatchlistButton address={address} />
              </div>
              <div className="token-address-row">
                <span>{address.slice(0, 10)}…{address.slice(-10)}</span>
                <CopyButton value={address} />
                <span className="soft-tag">{since(pair.pairCreatedAt)}</span>
              </div>
            </div>
          </div>

          <div className="token-pro-price">
            <span>LAST PRICE</span>
            <strong>{price(token.price)}</strong>
            <em className={token.change >= 0 ? "up" : "down"}>{token.change >= 0 ? "+" : ""}{token.change.toFixed(2)}% <small>24H</small></em>
          </div>
        </section>

        <section className="token-stat-grid">
          <div><span>MARKET CAP</span><strong>{money(token.marketCap)}</strong></div>
          <div><span>LIQUIDITY</span><strong>{money(token.liquidity)}</strong></div>
          <div><span>24H VOLUME</span><strong>{money(token.volume)}</strong></div>
          <div><span>BUYS / SELLS</span><strong>{token.buys?.toLocaleString() || 0} / {token.sells?.toLocaleString() || 0}</strong></div>
          <div><span>MARKET HEAT</span><strong className="heat-score">{heat}</strong></div>
        </section>

        <section className="token-terminal-grid">
          <div className="chart-panel data-card">
            <div className="chart-panel-head">
              <div>
                <span className="section-kicker">LIVE CHART</span>
                <h2>{token.symbol} / USD</h2>
              </div>
              <div className="chart-head-actions">
                <span className="chart-badge"><ShieldCheck size={13} /> DEX market data</span>
                {pair.url && <a href={pair.url} target="_blank" rel="noreferrer">DEX ↗</a>}
              </div>
            </div>
            <div className="chart-frame"><iframe title={token.symbol + " price chart"} src={chart} loading="lazy" /></div>
            <div className="chart-foot">
              <span><Users size={14} /> {token.txns?.toLocaleString() || 0} swaps / 24h</span>
              <span><Globe size={14} /> {website ? "Website linked" : "No website reported"}</span>
              <span>{xLink ? "X linked" : "No X link reported"}</span>
            </div>
          </div>

          <aside className="order-panel data-card">
            <div className="order-panel-head">
              <div><span className="section-kicker">INSTANT TRADE</span><h2>Trade {token.symbol}</h2></div>
              <WalletConnect />
            </div>
            <JupiterTrade outputMint={address} symbol={token.symbol} />
          </aside>
        </section>

        <section className="token-bottom-grid">
          <div className="data-card research-card">
            <div className="data-card-head">
              <div><span className="section-kicker">TOKEN SIGNALS</span><h2>Research snapshot</h2></div>
            </div>
            <div className="signal-detail-grid">
              <div><span>24H CHANGE</span><strong className={token.change >= 0 ? "up" : "down"}>{token.change >= 0 ? "+" : ""}{token.change.toFixed(2)}%</strong></div>
              <div><span>BUY / SELL FLOW</span><strong>{token.buys && token.sells ? (token.buys / Math.max(token.sells, 1)).toFixed(2) + "×" : "—"}</strong></div>
              <div><span>LIQUIDITY / MCAP</span><strong>{token.marketCap ? (token.liquidity / token.marketCap * 100).toFixed(1) + "%" : "—"}</strong></div>
              <div><span>PAIR AGE</span><strong>{since(pair.pairCreatedAt)}</strong></div>
            </div>
            <p className="research-note">TokenSpace shows market structure from public market data. It does not label a token as safe or unsafe.</p>
          </div>

          <div className="data-card links-card">
            <div className="data-card-head"><div><span className="section-kicker">LINKS</span><h2>Project surface</h2></div><ExternalLink size={17} /></div>
            <div className="token-links">
              {website && <a href={website} target="_blank" rel="noreferrer"><Globe size={15} /> Website <span>↗</span></a>}
              {xLink && <a href={xLink} target="_blank" rel="noreferrer"><span className="x-mini">X</span> Social profile <span>↗</span></a>}
              {pair.url && <a href={pair.url} target="_blank" rel="noreferrer"><ShieldCheck size={15} /> DEX Screener <span>↗</span></a>}
              {!website && !xLink && !pair.url && <div className="table-empty small">No verified project links in the current pair metadata.</div>}
            </div>
          </div>
        </section>
      </div>
    </TerminalShell>
  );
}
