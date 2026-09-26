import { Search, Bell, Settings, Wallet, Flame, Sparkles, TrendingUp, Star, ChevronDown, ArrowUpRight, MoreHorizontal } from "lucide-react";

const tokens=[
 {symbol:"FOMO",name:"Fomo Protocol",mc:"$2.84M",liq:"$412K",vol:"$1.92M",change:"+42.8%",score:"98",age:"18m",initial:"F"},
 {symbol:"PUMP",name:"Pump Society",mc:"$8.16M",liq:"$1.12M",vol:"$3.48M",change:"+31.4%",score:"95",age:"42m",initial:"P"},
 {symbol:"MOON",name:"Moonshot",mc:"$1.46M",liq:"$286K",vol:"$924K",change:"+27.9%",score:"93",age:"1h",initial:"M"},
 {symbol:"BYTE",name:"Byte AI",mc:"$4.21M",liq:"$604K",vol:"$1.17M",change:"+19.6%",score:"91",age:"2h",initial:"B"},
 {symbol:"WINK",name:"Wink",mc:"$764K",liq:"$142K",vol:"$516K",change:"+16.2%",score:"88",age:"3h",initial:"W"},
 {symbol:"SOLX",name:"SolX",mc:"$12.7M",liq:"$2.04M",vol:"$4.82M",change:"+12.8%",score:"86",age:"4h",initial:"S"},
 {symbol:"NOVA",name:"Nova Cat",mc:"$3.08M",liq:"$528K",vol:"$883K",change:"+9.7%",score:"82",age:"5h",initial:"N"},
];

function Logo(){return <div className="brand-mark"><span></span><span></span><span></span></div>}
function TokenIcon({letter}:{letter:string}){return <div className="token-icon">{letter}</div>}

export default function Home(){return <main className="terminal">
 <aside className="sidebar">
  <div className="brand"><Logo/><div><b>TokenSpace</b><small>SOLANA TERMINAL</small></div></div>
  <nav><a className="active"><Flame/>Discover</a><a><TrendingUp/>Markets</a><a><Star/>Watchlist</a></nav>
  <div className="side-label">WORKSPACE</div>
  <nav><a>Portfolio</a><a>Activity</a></nav>
  <div className="sidebar-bottom"><div className="network-dot"></div><div><small>NETWORK</small><strong>Solana Mainnet</strong></div></div>
 </aside>
 <section className="content">
  <header className="topbar"><div className="search"><Search size={17}/><span>Search token, address...</span><kbd>/</kbd></div><div className="top-actions"><button><Bell size={17}/></button><button><Settings size={17}/></button><button className="wallet"><Wallet size={16}/> Connect Wallet</button></div></header>
  <div className="page-head"><div><div className="eyebrow">SOLANA / DISCOVER</div><h1>Find what moves next.</h1><p>Track momentum, liquidity and activity across emerging Solana tokens.</p></div><button className="filter">All tokens <ChevronDown size={15}/></button></div>
  <div className="tabs"><button className="selected"><Flame size={15}/> Hot</button><button><Sparkles size={15}/> New</button><button><TrendingUp size={15}/> Gainers</button><button><Star size={15}/> Watchlist</button></div>
  <div className="market-strip"><div><span>MARKET</span><b>$6.42B</b><em>+3.8%</em></div><div><span>24H VOLUME</span><b>$2.18B</b></div><div><span>NEW TOKENS</span><b>18,421</b></div><div className="updated">Updated just now</div></div>
  <div className="table-wrap"><div className="table-head"><span>TOKEN</span><span>MARKET CAP</span><span>LIQUIDITY</span><span>24H VOLUME</span><span>24H</span><span>SCORE</span><span></span></div>
   {tokens.map((t,i)=><div className="token-row" key={t.symbol}><div className="token-name"><TokenIcon letter={t.initial}/><div><strong>{t.symbol}</strong><small>{t.name}</small></div>{i<3&&<span className="hot-dot">HOT</span>}</div><div className="mono">{t.mc}</div><div className="mono muted">{t.liq}</div><div className="mono muted">{t.vol}</div><div className="change">{t.change}</div><div><span className="score">{t.score}</span></div><button className="more"><MoreHorizontal size={17}/></button></div>)}
  </div>
 </section>
 </main>}