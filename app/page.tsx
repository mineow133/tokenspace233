"use client";
import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {Search,Bell,Settings,Wallet,Flame,Sparkles,TrendingUp,Star,MoreHorizontal,RefreshCw} from "lucide-react";

type Token={address:string;symbol:string;name:string;image:string;marketCap:number;liquidity:number;volume:number;change:number;score:number;createdAt?:string};
const mock:Token[]=[{address:"",symbol:"FOMO",name:"Fomo Protocol",image:"",marketCap:2840000,liquidity:412000,volume:1920000,change:42.8,score:98},{address:"",symbol:"PUMP",name:"Pump Society",image:"",marketCap:8160000,liquidity:1120000,volume:3480000,change:31.4,score:95}];
const money=(n:number)=>n>=1e9?"$"+(n/1e9).toFixed(2)+"B":n>=1e6?"$"+(n/1e6).toFixed(2)+"M":n>=1e3?"$"+(n/1e3).toFixed(1)+"K":"$"+n.toFixed(0);
function Logo(){return <div className="brand-mark"><span/><span/><span/></div>}
function TokenIcon({token}:{token:Token}){return token.image?<img className="token-icon" src={token.image} alt=""/>:<div className="token-icon">{token.symbol[0]}</div>}

export default function Home(){
 const [tokens,setTokens]=useState<Token[]>([]),[newTokens,setNewTokens]=useState<Token[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(""),[query,setQuery]=useState(""),[tab,setTab]=useState<"hot"|"new"|"gainers"|"watchlist">("hot");
 const load=async()=>{
   setLoading(true);setError("");
   try{
     const r=await fetch("/api/tokens",{cache:"no-store"});
     const d=await r.json();
     if(!r.ok)throw new Error(d.error||"Market data unavailable");
     setTokens(d.tokens?.length?d.tokens:mock);setNewTokens(d.newTokens?.length?d.newTokens:[]);
   }catch(e){setError(e instanceof Error?e.message:"Failed to load market data");setTokens(mock);setNewTokens([])}
   finally{setLoading(false)}
 };
 useEffect(()=>{load();const id=setInterval(load,30000);return()=>clearInterval(id)},[]);
 const source=tab==="new"?newTokens:tokens;
 const visible=useMemo(()=>{
   let rows=[...source];
   if(tab==="gainers") rows.sort((a,b)=>b.change-a.change);
   if(tab==="hot") rows.sort((a,b)=>b.score-a.score);
   if(tab==="new") rows.sort((a,b)=>Date.parse(b.createdAt||"0")-Date.parse(a.createdAt||"0"));
   return rows.filter(t=>(t.symbol+" "+t.name+" "+t.address).toLowerCase().includes(query.toLowerCase()));
 },[source,query,tab]);
 const tabs=[["hot","Hot",Flame],["new","New",Sparkles],["gainers","Gainers",TrendingUp],["watchlist","Watchlist",Star]] as const;
 return <main className="terminal"><aside className="sidebar"><div className="brand"><Logo/><div><b>TokenSpace</b><small>SOLANA TERMINAL</small></div></div><nav><a className="active"><Flame/>Discover</a><a><TrendingUp/>Markets</a><a><Star/>Watchlist</a></nav><div className="side-label">WORKSPACE</div><nav><a>Portfolio</a><a>Activity</a></nav><div className="sidebar-bottom"><div className="network-dot"/><div><small>NETWORK</small><strong>Solana Mainnet</strong></div></div></aside>
 <section className="content"><header className="topbar"><div className="search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search token, address..."/><kbd>/</kbd></div><div className="top-actions"><button><Bell size={17}/></button><button><Settings size={17}/></button><button className="wallet"><Wallet size={16}/> Connect Wallet</button></div></header>
 <div className="page-head"><div><div className="eyebrow">SOLANA / DISCOVER</div><h1>Find what moves next.</h1><p>Live momentum, liquidity and activity across emerging Solana tokens.</p></div><button className="filter" onClick={load}>Refresh <RefreshCw size={14}/></button></div>
 <div className="tabs">{tabs.map(([id,label,Icon])=><button key={id} className={tab===id?"selected":""} onClick={()=>setTab(id)}><Icon size={15}/>{label}</button>)}</div>
 <div className="market-strip"><div><span>TRACKED TOKENS</span><b>{loading?"—":tab==="new"?newTokens.length:tokens.length}</b></div><div><span>RANKING</span><b>LIVE</b><em> 30s</em></div><div><span>NETWORK</span><b>SOLANA</b></div><div className="updated">{error?"Fallback data":loading?"Loading market…":tab==="new"?"Recent pools via Jupiter + DEX Screener":"Live DEX Screener + Jupiter data"}</div></div>
 <div className="table-wrap"><div className="table-head"><span>TOKEN</span><span>MARKET CAP</span><span>LIQUIDITY</span><span>24H VOLUME</span><span>24H</span><span>SCORE</span><span/></div>
 {loading?<div className="empty">Loading Solana market…</div>:visible.length===0?<div className="empty">{tab==="watchlist"?"Connect a wallet to build your watchlist.":"No tokens match “"+query+"”."}</div>:visible.map((t,i)=><Link href={t.address?"/token/"+t.address:"/"} className="token-row" key={t.address||t.symbol+i}><div className="token-name"><TokenIcon token={t}/><div><strong>{t.symbol}</strong><small>{t.name}</small></div>{i<3&&tab!=="new"&&<span className="hot-dot">{tab==="gainers"?"UP":"HOT"}</span>}</div><div className="mono">{money(t.marketCap)}</div><div className="mono muted">{money(t.liquidity)}</div><div className="mono muted">{money(t.volume)}</div><div className={t.change>=0?"change":"change negative"}>{t.change>=0?"+":""}{t.change.toFixed(1)}%</div><div><span className="score">{t.score}</span></div><span className="more"><MoreHorizontal size={17}/></span></Link>)}</div></section></main>
}
