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
 return <main className="ts-home"><header className="ts-topbar"><Link href="/" className="ts-logo"><span className="ts-logo-mark"><i/><i/></span><span>TokenSpace<small>SOLANA TERMINAL</small></span></Link><nav className="ts-main-nav"><a className="active">Discover</a><a>Pulse</a><a>Trackers</a><a>Portfolio</a></nav><div className="ts-top-search"><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search token or address"/><kbd>/</kbd></div><div className="ts-top-right"><button className="icon-btn"><Bell size={15}/></button><button className="chain-btn"><span className="sol-dot"/>SOL <span>⌄</span></button><button className="ts-connect"><Wallet size={14}/> Connect</button></div></header><div className="ts-shell"><aside className="ts-left-rail"><div className="rail-title">MARKETS</div><button className="rail-item active"><Flame size={15}/> Trending</button><button className="rail-item"><Sparkles size={15}/> New Pairs</button><button className="rail-item"><TrendingUp size={15}/> Gainers</button><button className="rail-item"><Star size={15}/> Watchlist</button><div className="rail-title">NETWORK</div><button className="rail-chain active"><span className="sol-dot"/> Solana <b>LIVE</b></button><div className="rail-footer"><Activity size={14}/><div><small>MARKET FEED</small><b>30s refresh</b></div></div></aside><section className="ts-content"><div className="ts-page-heading"><div><div className="ts-eyebrow"><span/> SOLANA / DISCOVER</div><h1>Find what moves next.</h1><p>Scan momentum, liquidity and fresh launches — then trade without leaving the terminal.</p></div><button className="ts-refresh" onClick={()=>{setLoading(true);load()}}><RefreshCw size={14}/> Refresh</button></div><div className="ts-tabs">{tabs.map(([id,label,Icon])=><button key={id} className={tab===id?"active":""} onClick={()=>setTab(id)}><Icon size={14}/>{label}</button>)}</div><div className="ts-marketbar"><div><span>TRACKED</span><b>{loading?"—":source.length}</b></div><div><span>STATUS</span><b className="live-text">● LIVE</b></div><div><span>REFRESH</span><b>30s</b></div><div className="marketbar-note">{error?"Market data unavailable":"DEX Screener + Jupiter market layer"}</div></div><div className="ts-table"><div className="ts-table-head"><span>PAIR / TOKEN</span><span>CHART</span><span>MARKET CAP</span><span>LIQUIDITY</span><span>24H VOL</span><span>24H</span><span>SCORE</span><span/></div>{loading?<div className="ts-empty"><div className="loading-orb"/><b>Scanning Solana markets…</b><span>Pulling fresh pairs and momentum data</span></div>:visible.length===0?<div className="ts-empty"><b>{tab==="watchlist"?"Your watchlist is empty":"No matching tokens"}</b><span>Try another symbol or address.</span></div>:visible.map((t,i)=><Link href={"/token/"+t.address} className="ts-row" key={t.address}><div className="pair-cell"><TokenIcon token={t}/><div className="pair-copy"><div><strong>{t.symbol}</strong>{i<3&&tab!=="new"?<span className="hot-badge">HOT</span>:null}</div><small>{t.name}</small><div className="pair-meta"><span>{t.txns?.toLocaleString()||"—"} txns</span><span>SOL</span><span>● {Math.max(1,Math.round((t.score||0)/8))}</span></div></div></div><div className={t.change>=0?"spark up":"spark down"}>⌁</div><div className="num strong">{money(t.marketCap)}</div><div className="num">{money(t.liquidity)}</div><div className="num">{money(t.volume)}</div><div className={t.change>=0?"change-pill positive":"change-pill negative"}>{t.change>=0?"+":""}{t.change.toFixed(1)}%</div><div><span className="score-pill">{t.score}</span></div><div className="row-arrow">↗</div></Link>)}</div><div className="ts-bottom-note"><span>TokenSpace</span><span>Non-custodial</span><span>Jupiter routing</span><span>Solana mainnet</span><span className="push-right">Data updates every 30 seconds</span></div></section></div></main>