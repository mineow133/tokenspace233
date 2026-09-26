import Link from "next/link";
import {ArrowLeft,Copy,ExternalLink,ShieldCheck,Activity} from "lucide-react";
import WalletConnect from "../../../components/WalletConnect";
import JupiterTrade from "../../../components/JupiterTrade";

type Pair={
 baseToken?:{name?:string;symbol?:string;address?:string};
 priceUsd?:string;marketCap?:number;fdv?:number;liquidity?:{usd?:number};
 volume?:{h24?:number};priceChange?:{h24?:number};
 txns?:{h24?:{buys?:number;sells?:number}};
 info?:{imageUrl?:string};pairAddress?:string;url?:string;
};

const money=(n:number)=>n>=1e9?"$"+(n/1e9).toFixed(2)+"B":n>=1e6?"$"+(n/1e6).toFixed(2)+"M":n>=1e3?"$"+(n/1e3).toFixed(1)+"K":"$"+n.toFixed(2);
const price=(n:number)=>n>=1?"$"+n.toFixed(2):n>=.01?"$"+n.toFixed(4):n>=.0001?"$"+n.toFixed(6):"$"+n.toFixed(9);

async function getPair(address:string){
 const r=await fetch("https://api.dexscreener.com/tokens/v1/solana/"+address,{next:{revalidate:15}});
 if(!r.ok)return null;
 const pairs:Pair[]=await r.json();
 return pairs?.filter(p=>p.baseToken?.address===address).sort((a,b)=>(b.liquidity?.usd??0)-(a.liquidity?.usd??0))[0]??null;
}

export default async function TokenPage({params}:{params:Promise<{address:string}>}){
 const {address}=await params;
 const p=await getPair(address);
 if(!p)return <main className="token-terminal"><div className="token-not-found"><Link href="/" className="back">← Back to Discover</Link><h1>Token data unavailable</h1><p>This token is not currently indexed by the market data source.</p></div></main>;
 const t=p.baseToken!, change=p.priceChange?.h24??0;
 const chart="https://dexscreener.com/solana/"+p.pairAddress+"?embed=1&theme=dark&trades=0&info=0&chartLeftToolbar=0&chartStyle=1&interval=15";
 return <main className="token-terminal">
   <header className="token-nav">
     <Link href="/" className="token-brand"><span className="brand-dot"/>TokenSpace</Link>
     <div className="token-nav-right"><Link href="/" className="nav-back"><ArrowLeft size={14}/> Discover</Link><WalletConnect/></div>
   </header>

   <section className="token-head">
     <div className="token-head-left">
       {p.info?.imageUrl?<img src={p.info.imageUrl} className="token-logo" alt=""/>:<div className="token-logo token-letter">{t.symbol?.[0]}</div>}
       <div>
         <div className="token-kicker">SOLANA TOKEN</div>
         <div className="token-title"><h1>{t.symbol}</h1><span>{t.name}</span><button className="copy-address" title="Token address"><Copy size={12}/></button></div>
         <div className="token-address">{address.slice(0,8)}…{address.slice(-8)}</div>
       </div>
     </div>
     <div className="token-head-price"><div>{price(Number(p.priceUsd??0))}</div><span className={change>=0?"positive":"negative"}>{change>=0?"+":""}{change.toFixed(2)}% <small>24H</small></span></div>
   </section>

   <div className="token-layout">
     <section className="market-card">
       <div className="market-card-top"><div><span>PRICE</span><b>{price(Number(p.priceUsd??0))}</b></div><div className="chart-tools"><span className="active">15m</span><span>1H</span><span>4H</span><span>1D</span><a href={p.url} target="_blank" rel="noreferrer">DEX ↗</a></div></div>
       <div className="live-chart"><iframe title="Live token chart" src={chart} loading="lazy"/></div>
       <div className="market-metrics">
         <div><span>MARKET CAP</span><b>{money(p.marketCap??p.fdv??0)}</b></div>
         <div><span>LIQUIDITY</span><b>{money(p.liquidity?.usd??0)}</b></div>
         <div><span>24H VOLUME</span><b>{money(p.volume?.h24??0)}</b></div>
         <div><span>BUYS / SELLS</span><b>{(p.txns?.h24?.buys??0).toLocaleString()} / {(p.txns?.h24?.sells??0).toLocaleString()}</b></div>
       </div>
     </section>

     <aside className="trade-panel">
       <div className="trade-panel-head"><div><span>TRADE</span><b>{t.symbol}</b></div><div className="trade-safe"><ShieldCheck size={13}/> Jupiter</div></div>
       <JupiterTrade outputMint={address}/>
     </aside>
   </div>

   <section className="activity-card">
     <div className="activity-head"><div><span>MARKET ACTIVITY</span><h2>Recent activity</h2></div><ExternalLink size={15}/></div>
     <div className="activity-placeholder"><Activity size={17}/><span>Live on-chain trade stream is the next data module.</span></div>
   </section>
 </main>;
}