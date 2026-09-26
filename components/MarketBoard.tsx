"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Clock3, Flame, Gauge, Search, SlidersHorizontal, Sparkles, TrendingUp, Zap } from "lucide-react";
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
  title="Find the move before the crowd.",
  subtitle="A faster Solana discovery surface built around momentum, liquidity and immediate execution.",
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
      // Never blank a live market screen because one refresh failed.
    }finally{
      setFirstLoad(false);
      setRefreshing(false);
    }
  }

  useEffect(()=>{load();const id=window.setInterval(load,15000);return()=>window.clearInterval(id)},[]);
  useEffect(()=>{setVisibleCount(60)},[tab,filter,query]);
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

  const topVolume=tokens.length?[...tokens].sort((a,b)=>b.volume-a.volume)[0]:null;
  const freshest=newTokens.length?newTokens[0]:null;
  const avg=tokens.length?tokens.reduce((s,t)=>s+t.change,0)/tokens.length:0;
  const combined=tokens.reduce((s,t)=>s+t.volume,0);

  const lanes=[
    {key:"hot",label:"Hot now",icon:Flame,color:"purple",rows:tokens.slice(0,3)},
    {key:"new",label:"Fresh pairs",icon:Sparkles,color:"blue",rows:newTokens.slice(0,3)},
    {key:"gainers",label:"Fast gainers",icon:TrendingUp,color:"green",rows:[...tokens].sort((a,b)=>b.change-a.change).slice(0,3)}
  ] as const;

  return <div className="discover-page">
    <section className="hero-panel">
      <div className="hero-orb orb-a"/><div className="hero-orb orb-b"/><div className="hero-grid"/>
      <div className="hero-content">
        <div className="hero-eyebrow"><span className="live-dot"/> SOLANA MARKET INTELLIGENCE</div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
        <div className="hero-actions">
          <button className="primary-button" onClick={load} disabled={refreshing}><Zap size={16}/>{refreshing?"Updating…":"Refresh market"}</button>
          <div className="hero-status"><Activity size={15}/>{lastUpdated?"Live · "+secondsAgo+"s ago":"Connecting to market data"}</div>
        </div>
      </div>
      <div className="hero-metric"><span>TRACKED TOKENS</span><strong>{firstLoad?"—":tokens.length}</strong><small>{combined?money(combined)+" combined 24h volume":"live market signals"}</small></div>
    </section>

    <section className="stat-row">
      <div className="stat-card"><div className="stat-icon purple"><Gauge size={18}/></div><div><span>MARKET HEAT</span><strong>{firstLoad?"—":Math.round(tokens.reduce((s,t)=>s+t.score,0)/Math.max(tokens.length,1))}</strong></div><em>avg signal</em></div>
      <div className="stat-card"><div className="stat-icon blue"><Sparkles size={18}/></div><div><span>FRESHEST</span><strong>{freshest?freshest.symbol:"—"}</strong></div><em>{freshest?money(freshest.marketCap):"new pair"}</em></div>
      <div className="stat-card"><div className="stat-icon green"><TrendingUp size={18}/></div><div><span>AVG 24H</span><strong>{avg>=0?"+":""}{avg.toFixed(1)}%</strong></div><em>tracked basket</em></div>
      <div className="stat-card"><div className="stat-icon orange"><Zap size={18}/></div><div><span>TOP VOLUME</span><strong>{topVolume?topVolume.symbol:"—"}</strong></div><em>{topVolume?money(topVolume.volume):"24h volume"}</em></div>
    </section>

    <section className="signal-lanes">{lanes.map(({key,label,icon:Icon,color,rows})=><button key={key} className={"lane-card "+color} onClick={()=>setTab(key as "hot"|"new"|"gainers")}><div className="lane-head"><span><Icon size={15}/>{label}</span><span className="lane-arrow">↗</span></div>{rows.length?rows.map(t=><span className="lane-row" key={t.address}><span>{t.symbol}</span><strong className={t.change>=0?"up":"down"}>{t.change>=0?"+":""}{t.change.toFixed(1)}%</strong></span>):<span className="lane-empty">Waiting for live pairs…</span>}</button>)}</section>

    <div className={compact?"board-layout compact":"board-layout"}>
      <div>
        <section className="board-head">
          <div><span className="section-kicker">DISCOVER</span><h2>Live token radar</h2><p className="board-subtitle">{visible.length} matching signals · market cap refreshes every 15 seconds</p></div>
          <div className="board-tools"><div className="search-box"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search ticker, name, address"/><kbd>/</kbd></div><button className="filter-button"><SlidersHorizontal size={15}/> Filters</button></div>
        </section>
        <div className="mode-tabs"><button className={tab==="hot"?"active":""} onClick={()=>setTab("hot")}><Flame size={15}/>Hot</button><button className={tab==="new"?"active":""} onClick={()=>setTab("new")}><Sparkles size={15}/>New</button><button className={tab==="gainers"?"active":""} onClick={()=>setTab("gainers")}><TrendingUp size={15}/>Gainers</button></div>
        <div className="quick-filters"><span>FILTER</span>{(["all","small","flow","fresh"] as const).map(key=><button key={key} className={filter===key?"active":""} onClick={()=>setFilter(key)}>{key==="all"?"All":key==="small"?"MC < $1M":key==="flow"?"High flow":"Fresh < 24h"}</button>)}</div>
        <TokenTable tokens={visible.slice(0,visibleCount)} loading={firstLoad} emptyLabel="No Solana tokens match these filters."/>
        {visible.length>visibleCount&&<button className="load-more" onClick={()=>setVisibleCount(v=>Math.min(v+60,visible.length))}>Load 60 more · {visible.length-visibleCount} left</button>}
      </div>
      <aside className="pulse-column">
        <div className="side-widget"><div className="side-widget-head"><div><span className="section-kicker">LIVE PULSE</span><h3>Flow right now</h3></div><Clock3 size={17}/></div><div className="pulse-list">{tokens.slice(0,9).map((t,i)=><a href={t.address?"/token/"+t.address:"/"} className="pulse-row" key={t.address}><span className="pulse-rank">{String(i+1).padStart(2,"0")}</span><span className="pulse-token"><b>{t.symbol}</b><small>MC {money(t.marketCap)} · Vol {money(t.volume)}</small></span><span className={t.change>=0?"up":"down"}>{t.change>=0?"+":""}{t.change.toFixed(1)}%</span></a>)}</div></div>
        <div className="side-widget accent-widget"><div className="widget-glow"/><div className="side-widget-head"><div><span className="section-kicker">EXECUTION</span><h3>One screen. Zero context switching.</h3></div><Zap size={17}/></div><p>Market cap, flow and liquidity update in the same feed you use to open and trade a token.</p><div className="execution-pills"><span>Phantom</span><span>Solflare</span><span>Jupiter</span></div></div>
      </aside>
    </div>
  </div>;
}
