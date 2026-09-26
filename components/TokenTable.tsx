"use client";

import Link from "next/link";
import { ArrowUpRight, ExternalLink, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import WatchlistButton from "./WatchlistButton";

export type MarketToken = {
  address:string;symbol:string;name:string;image:string;marketCap:number;liquidity:number;volume:number;change:number;score:number;
  txns?:number;buys?:number;sells?:number;createdAt?:string;pairUrl?:string;price?:number;volume5m?:number;volume1h?:number;priceChange5m?:number;
};

function money(v:number){if(!Number.isFinite(v))return "—";if(v>=1e9)return "$"+(v/1e9).toFixed(2)+"B";if(v>=1e6)return "$"+(v/1e6).toFixed(2)+"M";if(v>=1e3)return "$"+(v/1e3).toFixed(1)+"K";return "$"+v.toFixed(0)}
function price(v:number){if(!v)return "—";if(v>=1)return "$"+v.toFixed(2);if(v>=.01)return "$"+v.toFixed(4);if(v>=.0001)return "$"+v.toFixed(6);return "$"+v.toFixed(9)}
function Avatar({token}:{token:MarketToken}){return token.image?<img className="market-avatar" src={token.image} alt=""/>:<span className="market-avatar fallback">{token.symbol.slice(0,1)}</span>}

function LiveValue({value}:{value:number}){
  const oldRef=useRef(value);
  const [dir,setDir]=useState<"up"|"down"|"same">("same");
  useEffect(()=>{
    const old=oldRef.current;
    if(value>old)setDir("up");else if(value<old)setDir("down");else setDir("same");
    oldRef.current=value;
    if(value!==old){const id=window.setTimeout(()=>setDir("same"),900);return()=>window.clearTimeout(id)}
  },[value]);
  return <span className={"live-value "+dir}>{dir==="up"?<TrendingUp size={13}/>:dir==="down"?<TrendingDown size={13}/>:<Minus size={12}/>}<span>{money(value)}</span></span>
}

export default function TokenTable({tokens,loading=false,emptyLabel="No matching tokens."}:{tokens:MarketToken[];loading?:boolean;emptyLabel?:string}){
  return <section className="data-card market-table-card">
    <div className="data-card-head"><div><span className="section-kicker">LIVE MARKET · 15S</span><h2>Token radar</h2></div><div className="table-source"><span className="live-dot"/>Market cap live</div></div>
    <div className="table-header market-grid"><span>TOKEN</span><span>PRICE</span><span>MARKET CAP</span><span>LIQUIDITY</span><span>24H VOLUME</span><span>24H</span><span>HEAT</span><span/></div>
    {loading?<div className="table-loading">{Array.from({length:8}).map((_,i)=><div className="table-skeleton market-grid" key={i}><span/><span/><span/><span/><span/><span/><span/><span/></div>)}</div>:tokens.length===0?<div className="table-empty">{emptyLabel}</div>:
      tokens.map((token,index)=>{const href=token.address?"/token/"+token.address:"/";return <div className="market-row market-grid" key={token.address||token.symbol+index}>
        <Link href={href} className="market-token-cell"><Avatar token={token}/><span className="token-copy"><strong>{token.symbol}</strong><small>{token.name}</small></span>{index<3&&<span className="tiny-tag">{index===0?"HOT":"FLOW"}</span>}</Link>
        <Link href={href} className="metric-link"><strong>{price(token.price??0)}</strong></Link>
        <Link href={href} className="metric-link live-mc-link"><LiveValue value={token.marketCap}/></Link>
        <Link href={href} className="metric-link muted">{money(token.liquidity)}</Link>
        <Link href={href} className="metric-link muted">{money(token.volume)}</Link>
        <Link href={href} className={token.change>=0?"metric-link change up":"metric-link change down"}>{token.change>=0?"+":""}{token.change.toFixed(1)}%</Link>
        <Link href={href} className="metric-link heat-cell"><span className="heat-pill">{token.score}</span></Link>
        <span className="row-actions"><WatchlistButton address={token.address}/>{token.pairUrl?<a href={token.pairUrl} target="_blank" rel="noreferrer" className="row-link" aria-label="Open DEX Screener"><ExternalLink size={14}/></a>:<ArrowUpRight size={14} className="muted-icon"/>}</span>
      </div>})}
  </section>
}
