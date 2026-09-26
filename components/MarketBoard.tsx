"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Filter, Flame, Search, SlidersHorizontal, Sparkles, TrendingUp } from "lucide-react";
import TokenTable, { MarketToken } from "./TokenTable";

type Props = { title?: string; subtitle?: string; compact?: boolean };

function money(value:number){
  if(!Number.isFinite(value))return "—";
  if(value>=1e9)return "$"+(value/1e9).toFixed(2)+"B";
  if(value>=1e6)return "$"+(value/1e6).toFixed(2)+"M";
  if(value>=1e3)return "$"+(value/1e3).toFixed(1)+"K";
  return "$"+value.toFixed(0);
}

export default function MarketBoard({
  title="Explore Solana pairs",
  subtitle="Real-time pair discovery across Solana liquidity venues.",
  compact=false
}:Props){
  const [tokens,setTokens]=useState<MarketToken[]>([]);
  const [newTokens,setNewTokens]=useState<MarketToken[]>([]);
  const [firstLoad,setFirstLoad]=useState(true);
  const [refreshing,setRefreshing]=useState(false);
  const [query,setQuery]=useState("");
  const [tab,setTab]=useState<"hot"|"new"|"gainers">("hot");
  const [filter,setFilter]=useState<"all"|"small"|"flow"|"fresh">("all");
  const [visibleCount,setVisibleCount]=useState(60);
  const [lastUpdated,setLastUpdated]=useState<number|null>(null);
  const [secondsAgo,setSecondsAgo]=useState(0);

  async function load(){
    if(firstLoad)setFirstLoad(true);else setRefreshing(true);
    try{
      const response=await fetch("/api/tokens?t="+Date.now(),{cache:"no-store"});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||"Market unavailable");
      setTokens(Array.isArray(data.tokens)?data.tokens:[]);
      setNewTokens(Array.isArray(data.newTokens)?data.newTokens:[]);
      setLastUpdated(data.updatedAt||Date.now());
      setSecondsAgo(0);
    }catch{
      // Preserve the last good snapshot.
    }finally{
      setFirstLoad(false);
      setRefreshing(false);
    }
  }

  useEffect(()=>{load();const id=window.setInterval(load,15000);return()=>window.clearInterval(id)},[]);
  useEffect(()=>setVisibleCount(60),[tab,filter,query]);
  useEffect(()=>{
    const id=window.setInterval(()=>{if(lastUpdated)setSecondsAgo(Math.floor((Date.now()-lastUpdated)/1000))},1000);
    return()=>window.clearInterval(id);
  },[lastUpdated]);

  const visible=useMemo(()=>{
    let rows=[...(tab==="new"?newTokens:tokens)];
    if(filter==="small")rows=rows.filter(t=>t.marketCap>0&&t.marketCap<1_000_000);
    if(filter==="flow")rows=rows.filter(t=>t.marketCap>0&&t.volume/t.marketCap>=0.12);
    if(filter==="fresh")rows=rows.filter(t=>{const d=Date.parse(t.createdAt||"");return d>0&&Date.now()-d<86_400_000});
    if(tab==="new")rows.sort((a,b)=>Date.parse(b.createdAt||"0")-Date.parse(a.createdAt||"0"));
    else if(tab==="gainers")rows.sort((a,b)=>b.change-a.change);
    else rows.sort((a,b)=>b.score-a.score);
    const needle=query.trim().toLowerCase();
    if(needle)rows=rows.filter(t=>(t.symbol+" "+t.name+" "+t.address).toLowerCase().includes(needle));
    return rows;
  },[tokens,newTokens,query,tab,filter]);

  const combined=tokens.reduce((s,t)=>s+t.volume,0);
  const txns=tokens.reduce((s,t)=>s+(t.txns||0),0);
  const avg=tokens.length?tokens.reduce((s,t)=>s+t.change,0)/tokens.length:0;

  const tabs=[
    {key:"hot",label:"Trending",icon:Flame},
    {key:"new",label:"New Pairs",icon:Sparkles},
    {key:"gainers",label:"Gainers",icon:TrendingUp}
  ] as const;

  return <div className={compact?"ds-page compact":"ds-page"}>
    <section className="ds-page-head">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="ds-market-meta">
        <div><span>24H VOLUME</span><strong>{combined?money(combined):"—"}</strong></div>
        <div><span>24H TXNS</span><strong>{txns?txns.toLocaleString():"—"}</strong></div>
      </div>
    </section>

    <section className="ds-time-row">
      <div className="ds-time-tabs"><button className="active">5M</button><button>1H</button><button>6H</button><button>24H</button></div>
      <span className="ds-period-note">Last 24 hours</span>
      <span className="ds-live-chip"><i /> Live · {lastUpdated?secondsAgo+"s ago":"connecting"}</span>
    </section>

    <section className="ds-market-nav">
      {tabs.map(({key,label,icon:Icon})=><button key={key} className={tab===key?"active":""} onClick={()=>setTab(key)}><Icon size={14}/>{label}</button>)}
      <button><Activity size={14}/> Alpha</button>
      <button className="ds-nav-muted">Boosted</button>
      <button className="ds-nav-muted">Launchpad</button>
    </section>

    <section className="ds-screen-controls">
      <div className="ds-rank-row">
        <span>Rank by:</span>
        <button className="active">Trending</button>
        <button>Volume</button>
        <button>Liquidity</button>
        <button>MCAP</button>
      </div>
      <div className="ds-control-right">
        <div className="ds-search"><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search pairs, tokens or addresses"/></div>
        <button className="ds-outline-btn"><Filter size={14}/> Filters</button>
        <button className="ds-outline-btn"><SlidersHorizontal size={14}/> Customize</button>
      </div>
    </section>

    <section className="ds-filter-row">
      <span>FILTERS</span>
      {(["all","small","flow","fresh"] as const).map(key=><button key={key} className={filter===key?"active":""} onClick={()=>setFilter(key)}>
        {key==="all"?"All pairs":key==="small"?"MC < $1M":key==="flow"?"High flow":"Age < 24h"}
      </button>)}
      <span className="ds-results">{visible.length.toLocaleString()} pairs</span>
    </section>

    <div className="ds-table-shell">
      <TokenTable tokens={visible.slice(0,visibleCount)} loading={firstLoad} emptyLabel="No Solana pairs match these filters." />
      {visible.length>visibleCount&&<button className="ds-load-more" onClick={()=>setVisibleCount(v=>Math.min(v+60,visible.length))}>Load more pairs · {visible.length-visibleCount} remaining</button>}
    </div>

    <div className="ds-footer-strip">
      <span>TokenSpace market scanner</span>
      <span>Sources: DEX Screener · Jupiter · GeckoTerminal</span>
      <span className={avg>=0?"up":"down"}>{avg>=0?"+":""}{avg.toFixed(2)}% avg tracked move</span>
    </div>
  </div>;
}
